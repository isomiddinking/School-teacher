// src/Components/Classes/Classes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// React Icons import
import {
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiAlertTriangle,
  FiBook,
  FiX,
  FiCheck,
  FiLoader,
  FiUser
} from 'react-icons/fi';

const Classes = ({ userRole }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null); // O'qituvchi ma'lumotlari uchun state
  
  const [newClassNumber, setNewClassNumber] = useState('');
  const [newClassName, setNewClassName] = useState('');
  
  const [editingClass, setEditingClass] = useState(null);
  const [editedNumber, setEditedNumber] = useState('');
  const [editedName, setEditedName] = useState('');
  
  const classNumbers = Array.from({ length: 5 }, (_, i) => i + 1);
  const classNames = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const classesCollectionRef = userRole === 'teacher' ? 'classes' : 'groups';
  const studentsCollectionRef = userRole === 'teacher' ? 'students' : 'children';

  const fetchUserInfo = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserInfo(userDocSnap.data());
      }
    } catch (err) {
      console.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik:", err);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    if (!userRole) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let qClasses;
      if (userRole === 'teacher') {
        qClasses = query(collection(db, classesCollectionRef), where('teacherId', '==', auth.currentUser.uid));
      } else {
        qClasses = collection(db, classesCollectionRef);
      }
      
      const querySnapshot = await getDocs(qClasses);
      const fetchedClasses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(fetchedClasses);
    } catch (err) {
      console.error("Sinf/guruhlarni yuklashda xatolik:", err);
      setError("Sinf/guruhlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [userRole, classesCollectionRef]);

  useEffect(() => {
    fetchUserInfo();
    fetchClasses();
  }, [fetchUserInfo, fetchClasses]);

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassNumber || !newClassName) {
      toast.error("Iltimos, sinf raqami va nomini tanlang.");
      return;
    }
    
    if (userRole === 'teacher' && (!auth.currentUser || !userInfo)) {
        toast.error("Foydalanuvchi ma'lumotlari yuklanmadi. Qayta urinib ko'ring.");
        return;
    }

    try {
      const classId = `${newClassNumber}-${newClassName}`.toUpperCase();
      const classDocRef = doc(db, classesCollectionRef, classId);
      const classDocSnap = await getDoc(classDocRef);
      
      if (classDocSnap.exists()) {
        toast.error("Bunday sinf allaqachon mavjud!");
        return;
      }
      
      const classData = {
        number: Number(newClassNumber),
        name: newClassName.toUpperCase(),
        createdAt: new Date(),
        // Add teacher info only if the user is a teacher
        ...(userRole === 'teacher' && {
            teacherId: auth.currentUser.uid,
            teacherName: userInfo?.name || auth.currentUser.displayName || 'Nomaʼlum oʻqituvchi'
        })
      };

      await setDoc(classDocRef, classData);
      toast.success("Sinf muvaffaqiyatli qo'shildi!");
      setNewClassNumber('');
      setNewClassName('');
      fetchClasses();
      
    } catch (err) {
      console.error("Sinf/Guruh qo'shishda xatolik:", err);
      toast.error("Sinf/Guruh qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editedNumber || !editedName) {
      toast.error("Iltimos, sinf/guruh raqami va nomini tanlang.");
      return;
    }

    try {
      const oldClassId = editingClass.id;
      const newClassId = `${editedNumber}-${editedName}`.toUpperCase();
      
      if (oldClassId !== newClassId) {
        const newClassDocRef = doc(db, classesCollectionRef, newClassId);
        const newClassDocSnap = await getDoc(newClassDocRef);
        if (newClassDocSnap.exists()) {
          toast.error("Bunday sinf allaqachon mavjud!");
          return;
        }
        
        const oldClassDocRef = doc(db, classesCollectionRef, oldClassId);
        const oldClassDocSnap = await getDoc(oldClassDocRef);
        const classData = oldClassDocSnap.data();

        // Use batch writes for atomic operations
        const batch = writeBatch(db);
        batch.delete(oldClassDocRef);
        batch.set(newClassDocRef, { ...classData, number: Number(editedNumber), name: editedName.toUpperCase() });

        const qStudents = query(collection(db, studentsCollectionRef), where('classId', '==', oldClassId));
        const studentsSnapshot = await getDocs(qStudents);
        
        studentsSnapshot.docs.forEach((studentDoc) => {
          const studentDocRef = doc(db, studentsCollectionRef, studentDoc.id);
          batch.update(studentDocRef, { classId: newClassId });
        });
        
        await batch.commit();
        
      } else {
        const classDocRef = doc(db, classesCollectionRef, oldClassId);
        await updateDoc(classDocRef, {
          number: Number(editedNumber),
          name: editedName.toUpperCase(),
        });
      }
      
      toast.success("Sinf/Guruh ma'lumotlari yangilandi.");
      setEditingClass(null);
      setEditedNumber('');
      setEditedName('');
      fetchClasses();
      
    } catch (err) {
      console.error("Sinf/Guruh ma'lumotlarini tahrirlashda xatolik:", err);
      toast.error("Sinf/Guruh ma'lumotlarini tahrirlashda xatolik yuz berdi.");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Haqiqatan ham bu sinf/guruhni o'chirishni xohlaysizmi?")) {
      try {
        const classDocRef = doc(db, classesCollectionRef, classId);
        
        const qStudents = query(collection(db, studentsCollectionRef), where('classId', '==', classId));
        const studentsSnapshot = await getDocs(qStudents);
        
        // Prevent deletion if students are assigned to the class/group
        if (!studentsSnapshot.empty) {
            toast.error("Sinfda o'quvchilar mavjud, o'chirish mumkin emas!");
            return;
        }

        await deleteDoc(classDocRef);
        toast.success("Sinf/Guruh muvaffaqiyatli o'chirildi.");
        fetchClasses();
      } catch (err) {
        console.error("Sinf/Guruhni o'chirishda xatolik:", err);
        toast.error("Sinf/Guruhni o'chirishda xatolik yuz berdi.");
      }
    }
  };

  const handleClassClick = (classId) => {
    navigate(`/classes/${classId}`);
  };

  const classesTitle = userRole === 'teacher' ? "Sinf ro'yxati" : "Guruhlar ro'yxati";
  const classType = userRole === 'teacher' ? "sinf" : "guruh";

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
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Qayta yuklash
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {userRole === 'teacher' ? "Sinf boshqaruvi" : "Guruh boshqaruvi"}
      </h1>
      <div className="w-20 h-1 bg-indigo-600 mb-6 rounded-full"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <FiPlusCircle className="h-5 w-5 mr-2 text-indigo-600" />
            Yangi {classType} qo'shish
          </h2>
          {userRole === 'teacher' && userInfo && (
            <div className="mb-4 flex items-center text-sm text-gray-600">
                <FiUser className="mr-2" />
                <span className="font-medium">O'qituvchi:</span> {userInfo.name}
            </div>
          )}
          
          <form onSubmit={handleAddClass} className="space-y-4">
            <div>
              <label htmlFor="newClassNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Sinf raqami
              </label>
              <select
                id="newClassNumber"
                name="newClassNumber"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white cursor-pointer"
                value={newClassNumber}
                onChange={(e) => setNewClassNumber(e.target.value)}
              >
                <option value="" disabled>Sinf raqamini tanlang</option>
                {classNumbers.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newClassName" className="block text-sm font-medium text-gray-700 mb-1">
                Sinf harfi
              </label>
              <select
                id="newClassName"
                name="newClassName"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none bg-white cursor-pointer"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              >
                <option value="" disabled>Sinf harfini tanlang</option>
                {classNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
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
              <FiBook className="h-5 w-5 mr-2 text-indigo-600" />
              {classesTitle} ({classes.length})
            </h2>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Hali {classType}lar mavjud emas.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {classes.map((classItem) => (
                  <li
                    key={classItem.id}
                    className="py-4 px-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                  >
                    {editingClass?.id === classItem.id ? (
                      <form onSubmit={handleEditClass} className="flex items-center space-x-2">
                        <select
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                          value={editedNumber}
                          onChange={(e) => setEditedNumber(e.target.value)}
                          required
                        >
                          {classNumbers.map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <select
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          required
                        >
                          {classNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                          aria-label="Saqlash"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingClass(null)}
                          className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200"
                          aria-label="Bekor qilish"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleClassClick(classItem.id)}
                          className="text-left text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200 focus:outline-none"
                        >
                          {classItem.number}-{classItem.name}
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingClass(classItem);
                              setEditedNumber(classItem.number);
                              setEditedName(classItem.name);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 p-1 rounded-full hover:bg-gray-200"
                            aria-label="Tahrirlash"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(classItem.id)}
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

export default Classes;