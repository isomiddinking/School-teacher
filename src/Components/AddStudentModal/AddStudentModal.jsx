// src/Pages/AddStudentPage/AddStudentPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUserPlus, FiLoader, FiAlertTriangle, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AddStudentPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    selectedClass: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [classes, setClasses] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const navigate = useNavigate();

  // 🔥 Firebase'dan sinflarni real vaqtda olish
  useEffect(() => {
    const classesRef = collection(db, 'classes');

    const unsubscribe = onSnapshot(classesRef, {
      next: (snapshot) => {
        const classesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classesData);
        setIsDataLoading(false);
        setFetchError('');
      },
      error: (err) => {
        console.error("❌ Sinflarni olishda xatolik:", err);
        setFetchError("Sinflarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        toast.error("Sinflarni yuklashda xatolik yuz berdi.");
        setIsDataLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔄 Input o'zgarishini boshqarish
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ✅ Yangi o'quvchi qo'shish funksiyasi
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.lastName || !formData.selectedClass) {
      setFormError("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1️⃣ Sinf hujjatini o'qish (READ)
        const classDocRef = doc(db, 'classes', formData.selectedClass);
        const classDoc = await transaction.get(classDocRef);

        if (!classDoc.exists()) {
          throw new Error("Sinf topilmadi. Ma'lumot qo'shish bekor qilindi.");
        }

        const classData = classDoc.data();
        const newStudentCount = (classData.studentCount || 0) + 1;
        const studentName = `${formData.name} ${formData.lastName}`;

        // 2️⃣ Yangi o'quvchini classes sub-kolleksiyasiga qo'shish (WRITE)
        const newStudentInClassRef = doc(collection(db, `classes/${formData.selectedClass}/students`));
        const studentData = {
          name: studentName,
          classId: formData.selectedClass,
          className: classData.className || classData.name, // Sinf nomini saqlaymiz
          createdAt: Timestamp.now(),
        };
        transaction.set(newStudentInClassRef, studentData);
        
        // 3️⃣ Yangi o'quvchini students asosiy kolleksiyasiga qo'shish (WRITE)
        const newStudentRef = doc(collection(db, 'students'));
        transaction.set(newStudentRef, studentData);

        // 4️⃣ Sinfdagi o'quvchilar sonini yangilash (WRITE)
        transaction.update(classDocRef, { studentCount: newStudentCount });
      });

      toast.success("✅ O'quvchi muvaffaqiyatli qo'shildi!");
      // Navigate after a short delay to show success message
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error("❌ O'quvchi qo'shishda xatolik:", err);
      setFormError("O'quvchi qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      toast.error("O'quvchi qo'shishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-indigo-200 transition-colors duration-200 flex items-center p-2 rounded-full hover:bg-indigo-700"
                aria-label="Ortga qaytish"
              >
                <FiArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-center flex-grow">Yangi o'quvchi qo'shish</h2>
              <div className="w-8"></div>
            </div>
            <div className="w-16 h-1 bg-indigo-300 mx-auto rounded-full"></div>
          </div>
          
          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleAddStudent} className="space-y-5">
              
              {/* Ism Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ism <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required
                    disabled={loading}
                    placeholder="O'quvchi ismi"
                  />
                  {formData.name && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Familiya Input */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Familiya <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required
                    disabled={loading}
                    placeholder="O'quvchi familiyasi"
                  />
                  {formData.lastName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sinf tanlash */}
              <div>
                <label htmlFor="selectedClass" className="block text-sm font-medium text-gray-700 mb-2">
                  Sinfni tanlash <span className="text-red-500">*</span>
                </label>
                {isDataLoading ? (
                  <div className="flex items-center justify-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                    <FiLoader className="animate-spin mr-2" size={20} /> Sinflar yuklanmoqda...
                  </div>
                ) : fetchError ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                    <FiAlertTriangle className="mr-2" /> {fetchError}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="selectedClass"
                      name="selectedClass"
                      value={formData.selectedClass}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                      disabled={loading}
                    >
                      <option value="" disabled>Sinfni tanlang</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.number ? `${c.number}` : ''}
                          {c.number && c.name ? ' - ' : ''}
                          {c.name || "Nomsiz sinf"}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                  <FiAlertTriangle className="mr-2" /> {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading || !formData.selectedClass || !formData.name || !formData.lastName}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" size={18} />
                    Qo'shilmoqda...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-2" size={18} />
                    O'quvchi qo'shish
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Toast notifications */}
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
    </div>
  );
};

export default AddStudentPage;