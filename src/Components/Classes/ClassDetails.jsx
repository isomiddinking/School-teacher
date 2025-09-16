// src/Components/Classes/ClassDetails.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icon imports
import {
  FiUsers,
  FiPlusCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiLoader
} from 'react-icons/fi';

const ClassDetails = ({ userRole }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newStudentName, setNewStudentName] = useState('');
  
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editedStudentName, setEditedStudentName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  
  const studentsCollectionRef = userRole === 'teacher' ? 'students' : 'children';

  const fetchStudents = useCallback(async () => {
    if (!userRole) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, studentsCollectionRef), where('classId', '==', classId));
      const querySnapshot = await getDocs(q);
      
      const fetchedStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(fetchedStudents);
    } catch (err) {
      console.error("O'quvchilar ro'yxatini yuklashda xatolik:", err);
      setError("O'quvchilar ro'yxatini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [classId, userRole, studentsCollectionRef]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) {
      return students;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return students.filter(student =>
      student.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [students, searchQuery]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      toast.error("Iltimos, o'quvchi ismini kiriting.");
      return;
    }

    try {
      await addDoc(collection(db, studentsCollectionRef), {
        name: newStudentName.trim(),
        classId: classId,
        createdAt: new Date(),
      });
      toast.success("O'quvchi muvaffaqiyatli qo'shildi!");
      setNewStudentName('');
      fetchStudents();
    } catch (err) {
      console.error("O'quvchi qo'shishda xatolik:", err);
      toast.error("O'quvchi qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editedStudentName.trim()) {
      toast.error("Iltimos, o'quvchi ismini kiriting.");
      return;
    }

    try {
      const studentDocRef = doc(db, studentsCollectionRef, editingStudentId);
      await updateDoc(studentDocRef, {
        name: editedStudentName.trim(),
      });
      toast.success("O'quvchi ma'lumotlari yangilandi.");
      setEditingStudentId(null);
      setEditedStudentName('');
      fetchStudents();
    } catch (err) {
      console.error("O'quvchi ma'lumotlarini tahrirlashda xatolik:", err);
      toast.error("O'quvchi ma'lumotlarini tahrirlashda xatolik yuz berdi.");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Haqiqatan ham bu o'quvchini o'chirishni xohlaysizmi?")) {
      try {
        const studentDocRef = doc(db, studentsCollectionRef, studentId);
        await deleteDoc(studentDocRef);
        toast.success("O'quvchi muvaffaqiyatli o'chirildi.");
        fetchStudents();
      } catch (err) {
        console.error("O'quvchini o'chirishda xatolik:", err);
        toast.error("O'quvchini o'chirishda xatolik yuz berdi.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <FiLoader className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="ml-3 text-lg font-medium text-gray-700">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600">
        <FiAlertTriangle className="h-16 w-16 mb-4" />
        <p className="text-xl mb-4 text-center">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Ortga qaytish
        </button>
      </div>
    );
  }

  const studentsTitle = userRole === 'teacher' ? "O'quvchilar ro'yxati" : "Bolalar ro'yxati";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 flex items-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-sm font-medium"
      >
        <FiArrowLeft className="h-5 w-5 mr-2" />
        Ortga qaytish
      </button>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        "{classId}" {userRole === 'teacher' ? "sinfining o'quvchilari" : "guruhining bolalari"}
      </h1>
      <div className="w-20 h-1 bg-indigo-600 mb-6 rounded-full"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <FiPlusCircle className="h-5 w-5 mr-2 text-indigo-600" />
            Yangi {userRole === 'teacher' ? "o'quvchi" : "bola"} qo'shish
          </h2>
          
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label htmlFor="newStudentName" className="block text-sm font-medium text-gray-700 mb-1">
                Ism va familiya
              </label>
              <input
                id="newStudentName"
                name="newStudentName"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Falonchi Falonchiyev"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-md"
            >
              Qo'shish
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FiUsers className="h-5 w-5 mr-2 text-indigo-600" />
              {studentsTitle} ({filteredStudents.length}/{students.length})
            </h2>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ism yoki familiya bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Bu {userRole === 'teacher' ? "sinfda" : "guruhda"} hali {userRole === 'teacher' ? "o'quvchi" : "bola"} yo'q.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiAlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>"{searchQuery}" so'rovi bo'yicha hech qanday {userRole === 'teacher' ? "o'quvchi" : "bola"} topilmadi.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <li
                    key={student.id}
                    className="py-4 px-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                  >
                    {editingStudentId === student.id ? (
                      <form onSubmit={handleEditStudent} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editedStudentName}
                          onChange={(e) => setEditedStudentName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                          aria-label="Saqlash"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingStudentId(null); setEditedStudentName(''); }}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200"
                          aria-label="Bekor qilish"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-medium">{student.name}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingStudentId(student.id);
                              setEditedStudentName(student.name);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 p-1 rounded-full hover:bg-gray-200"
                            aria-label="Tahrirlash"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
                            aria-label="O'chirish"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default ClassDetails;