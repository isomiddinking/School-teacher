// src/components/Students/Students.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FiSearch, FiUsers, FiAlertTriangle, FiLoader, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Yuklanish holatini ko'rsatish komponenti
const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
    <FiLoader className="animate-spin h-10 w-10 mb-4" />
    <p>Ma'lumotlar yuklanmoqda...</p>
  </div>
);

// Guruh va bolalarni birlashtirish funksiyasi
const mergeChildrenWithGroups = async (children, teacherId) => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('teacherId', '==', teacherId));
  const querySnapshot = await getDocs(q);
  const groups = {};
  querySnapshot.forEach((doc) => {
    groups[doc.id] = doc.data().name;
  });

  return children.map((child) => ({
    ...child,
    groupName: groups[child.groupId] || 'Nomaʼlum guruh',
  }));
};

const AllUsers = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = auth.currentUser;

  // Bolalar ro'yxatini va ularning guruhlarini yuklash
  useEffect(() => {
    if (!currentUser) {
      setError("Avtorizatsiya xatosi. Iltimos, qayta kiring.");
      setLoading(false);
      return;
    }

    const childrenRef = collection(db, 'children');
    const q = query(childrenRef, where('teacherId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const childrenData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const childrenWithGroups = await mergeChildrenWithGroups(childrenData, currentUser.uid);
          setChildren(childrenWithGroups);
          setLoading(false);
        } catch (e) {
          console.error("Bolalar ma'lumotlarini yuklashda xato: ", e);
          setError("Bolalar ma'lumotlarini yuklashda xato yuz berdi.");
          toast.error("Ma'lumotlarni yuklashda xato yuz berdi.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("OnSnapshot xatosi: ", err);
        setError("Ma'lumotlarni real vaqtda yangilashda xato.");
        toast.error("Real-time yangilashda xato.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Qidiruv funksiyasini optimallashtirish
  const filteredChildren = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return children.filter(child =>
      (child.name && child.name.toLowerCase().includes(lowerCaseQuery)) ||
      (child.lastName && child.lastName.toLowerCase().includes(lowerCaseQuery)) ||
      (child.groupName && child.groupName.toLowerCase().includes(lowerCaseQuery))
    );
  }, [children, searchQuery]);

  // Bolani o'chirish funksiyasi
  const handleDeleteChild = async (childId) => {
    if (window.confirm("Haqiqatan ham bu bolani o'chirmoqchimisiz?")) {
      try {
        // Bu yerda Firebasedan bolani o'chirish kodi bo'lishi kerak
        // await deleteDoc(doc(db, 'children', childId));
        toast.success("Bola muvaffaqiyatli o'chirildi");
      } catch (error) {
        console.error("Bolani o'chirishda xato:", error);
        toast.error("Bolani o'chirishda xato yuz berdi");
      }
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] text-center">
        <FiAlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">{error}</h3>
        <p className="mt-2 text-gray-500">Iltimos, keyinroq qayta urinib ko'ring.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Barcha bolalar</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ism, familiya yoki guruh nomi bo'yicha qidiruv"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        {filteredChildren.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredChildren.map((child) => (
              <li key={child.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 px-3 rounded-lg transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <FiUsers className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {child.name} {child.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Guruh: <span className="font-medium text-gray-700">{child.groupName}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              {searchQuery ? "Hech qanday bola topilmadi" : "Sizda hali bolalar ro'yxati yo'q"}
            </h3>
            {!searchQuery && (
              <p className="mt-1 text-sm text-gray-500">
                Yangi bolalarni qo'shish uchun dashboard sahifasidan foydalanishingiz mumkin.
              </p>
            )}
          </div>
        )}
      </div>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
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

export default AllUsers;