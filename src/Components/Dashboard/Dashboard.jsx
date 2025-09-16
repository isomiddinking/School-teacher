// src/Components/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

// Icon imports
import { 
  FiHome, 
  FiUsers, 
  FiBook, 
  FiPlusCircle, 
  FiAlertTriangle, 
  FiX,
  FiLoader,
  FiClipboard,
  FiUser
} from 'react-icons/fi';

// Modal component for adding a new class
const AddClassModal = ({ isOpen, onClose, onAddClass }) => {
  const [classNumber, setClassNumber] = useState('');
  const [className, setClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lists for class numbers and letters
  const classNumbers = Array.from({ length: 5 }, (_, i) => i + 1); // 1 dan 5 gacha
  const classNames = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classNumber || !className) {
      toast.error("Iltimos, sinf raqami va nomini tanlang.");
      return;
    }
    
    setIsSubmitting(true);
    await onAddClass(classNumber, className);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 transform transition-transform duration-300 scale-100 animate-scale-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Yangi sinf yaratish</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="modal-classNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Sinf raqami
            </label>
            <select
              id="modal-classNumber"
              name="classNumber"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="" disabled>Sinf raqamini tanlang</option>
              {classNumbers.map(num => (
                <option key={num} value={num}>{num}-sinf</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="modal-className" className="block text-sm font-medium text-gray-700 mb-1">
              Sinf harfi
            </label>
            <select
              id="modal-className"
              name="className"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="" disabled>Sinf harfini tanlang</option>
              {classNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <FiLoader className="animate-spin mr-2" size={16} />
                Qo'shilmoqda...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiPlusCircle className="mr-2" size={16} />
                Qo'shish
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Class Card component with hover animations
const ClassCard = ({ cls, studentCount }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-indigo-400 cursor-pointer transform hover:-translate-y-1"
      onClick={() => navigate(`/classes/${cls.id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-3 rounded-xl mr-4">
            <FiBook className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{cls.number}-{cls.name} sinfi</h3>
            <p className="text-sm text-gray-500">{cls.teacherName}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">O'quvchilar soni:</span>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
          {studentCount} ta
        </span>
      </div>
    </div>
  );
};

// Main Dashboard component
const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classStudents, setClassStudents] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserInfo(userData);
        setUserRole(userData.role);
        
        if (userData.role === 'teacher') {
          const qClasses = query(collection(db, 'classes'), where('teacherId', '==', auth.currentUser.uid));
          const querySnapshotClasses = await getDocs(qClasses);
          const fetchedClasses = [];
          const classIds = [];
          
          querySnapshotClasses.forEach((doc) => {
            fetchedClasses.push({ id: doc.id, ...doc.data() });
            classIds.push(doc.id);
          });
          
          setClasses(fetchedClasses);

          const studentsCount = {};
          let totalCount = 0;
          
          if (classIds.length > 0) {
            for (const classId of classIds) {
              const qStudents = query(collection(db, 'students'), where('classId', '==', classId));
              const querySnapshotStudents = await getDocs(qStudents);
              studentsCount[classId] = querySnapshotStudents.size;
              totalCount += querySnapshotStudents.size;
            }
          }
          
          setClassStudents(studentsCount);
          setTotalStudents(totalCount);
        }
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error("Dashboard ma'lumotlarini yuklashda xatolik:", error);
      toast.error("Dashboard ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddClass = async (classNumber, className) => {
    if (!userInfo || !auth.currentUser) {
      toast.error("Foydalanuvchi ma'lumotlari topilmadi. Qayta urinib ko'ring.");
      return;
    }

    try {
      const classId = `${classNumber}-${className}`.toUpperCase();
      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);

      if (classDocSnap.exists()) {
        toast.error("Bunday sinf allaqachon mavjud!");
        return;
      }

      const classData = {
        number: Number(classNumber),
        name: className.toUpperCase(),
        teacherId: auth.currentUser.uid,
        teacherName: userInfo?.name || auth.currentUser.displayName || 'Nomaʼlum oʻqituvchi',
        createdAt: new Date(),
      };

      await setDoc(classDocRef, classData);
      toast.success("Sinf muvaffaqiyatli qo'shildi!");
      
      await fetchDashboardData();

    } catch (err) {
      console.error("Sinf qo'shishda xatolik:", err);
      toast.error("Sinf qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <FiHome className="mr-3" size={32} />
            Boshqaruv paneli
          </h1>
          <p className="text-lg text-gray-600 flex items-center">
            Xush kelibsiz, <span className="font-semibold text-indigo-600 ml-1 mr-1">{userInfo?.name || 'Foydalanuvchi'}</span>!
            <FiUser className="ml-2" size={18} />
          </p>
        </div>

        {userRole === 'teacher' ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                    <FiBook className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jami sinflar</p>
                    <h3 className="text-2xl font-bold text-gray-800">{classes.length} ta</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <FiUsers className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jami o'quvchilar</p>
                    <h3 className="text-2xl font-bold text-gray-800">{totalStudents} ta</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <FiClipboard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">O'rtacha o'quvchilar</p>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {classes.length > 0 ? Math.round(totalStudents / classes.length) : 0} ta
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* "Add Class" button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-5 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FiPlusCircle className="mr-2" size={18} />
                Yangi sinf qo'shish
              </button>
            </div>

            {/* Class Cards */}
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <ClassCard 
                    key={cls.id} 
                    cls={cls} 
                    studentCount={classStudents[cls.id] || 0} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                <FiBook className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Hali sinflar mavjud emas</h3>
                <p className="text-gray-500 mb-6">Yangi sinf qo'shish uchun yuqoridagi tugmani bosing</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center mx-auto"
                >
                  <FiPlusCircle className="mr-2" size={16} />
                  Sinf qo'shish
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <FiAlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sizda sinflarni ko'rish uchun ruxsat yo'q</h3>
            <p className="text-gray-500">Faqat o'qituvchilar sinflarni boshqarishi mumkin.</p>
          </div>
        )}
        
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

export default Dashboard;