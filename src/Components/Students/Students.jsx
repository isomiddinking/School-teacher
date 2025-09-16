// src/components/Teacher/Students.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/';
import { IoArrowBackOutline } from 'react-icons/io5';
import { FiSearch } from 'react-icons/fi';

// Yuklanish holatini ko'rsatish komponenti
const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
    <p className="text-gray-600">Yuklanmoqda...</p>
  </div>
);

// O'quvchi ma'lumotlarini to'liqroq ko'rsatish komponenti
const StudentListItem = ({ student }) => (
  <li className="p-6 flex items-center justify-between bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-indigo-100">
    <div className="flex-1">
      <p className="text-lg font-semibold text-gray-800">
        {student.name} {student.lastName}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Sinf: {student.classId || 'Ma\'lumot yo\'q'}
        </span>
        {student.className && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {student.className}
          </span>
        )}
        {student.teacherName && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            O'qituvchi: {student.teacherName}
          </span>
        )}
      </div>
    </div>
    <div className="ml-4 flex-shrink-0">
      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </li>
);

// Asosiy Students komponenti
const Students = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let title = 'Barcha o‘quvchilar';
        let studentsQuery;
        let classesMap = {};
        let teachersMap = {};

        // Barcha sinf va o'qituvchilar ma'lumotlarini oldindan yuklab olamiz
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        classesSnapshot.docs.forEach(doc => {
          const classData = doc.data();
          classesMap[doc.id] = { name: classData.name, teacherId: classData.teacherId };
        });

        const teachersSnapshot = await getDocs(collection(db, 'teachers'));
        teachersSnapshot.docs.forEach(doc => {
          teachersMap[doc.id] = doc.data().name;
        });

        if (classId) {
          const classDocRef = doc(db, 'classes', classId);
          const docSnap = await getDoc(classDocRef);
          if (docSnap.exists()) {
            title = `${docSnap.data().name} o'quvchilari`;
          } else {
            title = "Sinf topilmadi";
            setError("Sinf ma'lumotlar bazasida topilmadi.");
          }
          studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
        } else {
          studentsQuery = query(collection(db, 'students'));
        }

        setClassName(title);

        const unsubscribe = onSnapshot(
          studentsQuery,
          (snapshot) => {
            const studentsData = snapshot.docs.map(doc => {
              const student = doc.data();
              // Sinf nomini va o'qituvchi ismini topish
              const className = classesMap[student.classId]?.name;
              const teacherId = classesMap[student.classId]?.teacherId;
              const teacherName = teachersMap[teacherId];
              
              return {
                id: doc.id,
                ...student,
                className,
                teacherName
              };
            });
            setStudents(studentsData);
            setLoading(false);
          },
          (err) => {
            console.error("O'quvchilarni yuklashda xatolik:", err);
            setError("O'quvchilarni yuklashda xatolik yuz berdi.");
            setLoading(false);
          }
        );
        return () => unsubscribe();
      } catch (e) {
        console.error("Ma'lumotlarni yuklashda kutilmagan xatolik:", e);
        setError("Ma'lumotlarni yuklashda kutilmagan xatolik yuz berdi.");
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Orqaga qaytish"
          >
            <IoArrowBackOutline size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{className}</h1>
        </div>

        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Ism yoki familiya bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition duration-200"
          />
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredStudents.length > 0 ? (
            <ul className="space-y-4">
              {filteredStudents.map((student) => (
                <StudentListItem key={student.id} student={student} />
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">O'quvchilar topilmadi</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm ? "Qidiruv bo'yicha hech qanday o'quvchi topilmadi." : "O'quvchilar ro'yxati bo'sh."}
              </p>
            </div>
          )}
        </div>

        {filteredStudents.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Jami: {filteredStudents.length} ta o'quvchi
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;