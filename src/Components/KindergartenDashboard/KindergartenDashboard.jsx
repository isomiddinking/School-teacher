// src/Components/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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
const AddGroupModal = ({ isOpen, onClose, onAddGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName) {
      toast.error("Iltimos, guruh nomini kiriting.");
      return;
    }
    setIsSubmitting(true);
    await onAddGroup(groupName);
    setIsSubmitting(false);
    setGroupName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Yangi guruh qo'shish</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">guruh nomi</label>
            <input
              type="text"
              id="groupName"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="Masalan: Steam guruhi"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Qo\'shilmoqda...' : 'guruh qo\'shish'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:border-indigo-100 hover:transform hover:-translate-y-1">
    <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-full text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-200">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500 text-lg font-bold">{value}</p>
    </div>
  </div>
);

const Dashboard = ({ userRole }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = auth.currentUser;

  // State to store summary data
  const [groupStudentCounts, setGroupStudentCounts] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [averageStudents, setAverageStudents] = useState(0);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          }
        } catch (err) {
          toast.error("Foydalanuvchi ma'lumotlarini yuklashda xato yuz berdi.");
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  // Fetch groups and calculate summary data
  const fetchGroups = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const groupsQuery = query(collection(db, 'groups'), where('teacherId', '==', currentUser.uid));
      const groupsSnapshot = await getDocs(groupsQuery);
      const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);

      let totalStudentsCount = 0;
      const counts = {};

      groupsData.forEach(group => {
        const studentsQuery = query(collection(db, 'children'), where('groupId', '==', group.id));
        onSnapshot(studentsQuery, (snapshot) => {
          counts[group.id] = snapshot.size;
          setGroupStudentCounts(prevCounts => ({
            ...prevCounts,
            [group.id]: snapshot.size
          }));

          const currentTotalStudents = Object.values({ ...counts, ...groupStudentCounts }).reduce((acc, count) => acc + count, 0);
          const currentAverageStudents = groupsData.length > 0 ? (currentTotalStudents / groupsData.length).toFixed(0) : 0;
          setTotalStudents(currentTotalStudents);
          setAverageStudents(currentAverageStudents);
        });
      });

      const initialTotal = groupsData.reduce((acc, group) => acc + (groupStudentCounts[group.id] || 0), 0);
      setTotalStudents(initialTotal);
      setAverageStudents(groupsData.length > 0 ? (initialTotal / groupsData.length).toFixed(0) : 0);

    } catch (err) {
      toast.error("guruhlarni yuklashda xato yuz berdi: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAddGroup = async (groupName) => {
    if (!currentUser) return;
    try {
      // Check if a group with the same name already exists
      const groupExistsQuery = query(collection(db, 'groups'), where('teacherId', '==', currentUser.uid), where('name', '==', groupName));
      const existingGroups = await getDocs(groupExistsQuery);

      if (!existingGroups.empty) {
        toast.error("Bu nomdagi guruh allaqachon mavjud. Boshqa nom tanlang.");
        return;
      }

      const newGroupRef = doc(collection(db, 'groups'));
      await setDoc(newGroupRef, {
        name: groupName,
        teacherId: currentUser.uid,
        createdAt: new Date(),
      });
      toast.success("Yangi guruh muvaffaqiyatli qo'shildi!");
      fetchGroups();
      setIsModalOpen(false);
    } catch (e) {
      toast.error("guruh qo'shishda xato yuz berdi: " + e.message);
    }
  };

  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <FiLoader className="animate-spin text-indigo-500 h-10 w-10" />
        </div>
      );
    }

    if (groups.length > 0) {
      return (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Guruhlarim</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center shadow-md hover:shadow-lg"
            >
              <FiPlusCircle className="mr-2" size={16} />
              Yangi guruh qo'shish
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-full text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-200">
                  <FiClipboard size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors duration-300">{group.name}</h3>
                  <p className="text-gray-500 text-sm">{userData?.name || "Foydalanuvchi"}</p>
                  <p className="text-gray-500">O'quvchilar soni: {groupStudentCounts[group.id] ?? '...'}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transition-all duration-300 hover:shadow-md">
        <FiUsers className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Hali guruhlar mavjud emas</h3>
        <p className="text-gray-500 mb-6">Yangi guruh qo'shish uchun yuqoridagi tugmani bosing</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center mx-auto"
        >
          <FiPlusCircle className="mr-2" size={16} />
          Yangi guruh qo'shish
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center text-3xl font-bold text-gray-900 mb-2 space-x-2">
        <FiHome size={28} className="text-gray-600" />
        <h1>Boshqaruv paneli</h1>
      </div>
      <div className="flex items-center text-lg text-gray-600 mb-8 space-x-2">
        <p>Xush kelibsiz, {userData?.name || "Foydalanuvchi"}</p>
        <FiUser size={20} className="text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Jami guruhlar"
          value={`${groups.length} ta`}
          icon={FiClipboard}
        />
        <SummaryCard
          title="Jami o'quvchilar"
          value={`${totalStudents} ta`}
          icon={FiUsers}
        />
        <SummaryCard
          title="O'rtacha o'quvchilar"
          value={`${averageStudents} ta`}
          icon={FiBook}
        />
      </div>
      <DashboardContent />

      <AddGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddGroup={handleAddGroup}
      />
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

export default Dashboard;