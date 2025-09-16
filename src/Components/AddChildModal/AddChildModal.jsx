// src/Pages/AddChildPage/AddChildPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, Timestamp, runTransaction, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUserPlus, FiLoader, FiX, FiCheck, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AddChildPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    selectedGroup: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [groups, setGroups] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const navigate = useNavigate();

  const currentUser = auth.currentUser;

  // Guruhlarni Firebase'dan real vaqtda olish
  useEffect(() => {
    if (!currentUser) {
      setFetchError("Avtorizatsiyadan o'tilmagan foydalanuvchi.");
      setIsDataLoading(false);
      return;
    }

    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('teacherId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
        setIsDataLoading(false);
      },
      (error) => {
        console.error("Guruhlarni yuklashda xato yuz berdi: ", error);
        setFetchError("Guruhlarni yuklashda xato yuz berdi.");
        setIsDataLoading(false);
        toast.error("Guruhlarni yuklashda xato yuz berdi.");
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    if (!formData.name || !formData.lastName || !formData.selectedGroup) {
      setFormError("Iltimos, barcha maydonlarni to'ldiring.");
      setLoading(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const newChildRef = doc(collection(db, 'children'));
        
        transaction.set(newChildRef, {
          name: formData.name,
          lastName: formData.lastName,
          groupId: formData.selectedGroup,
          teacherId: currentUser.uid,
          createdAt: Timestamp.now(),
        });
      });

      toast.success("Bola muvaffaqiyatli qo'shildi!");
      setTimeout(() => navigate('/kindergarten'), 1500); // Ma'lum vaqtdan so'ng qaytarish
    } catch (error) {
      console.error("Bolani qo'shishda xato: ", error);
      setFormError("Bolani qo'shishda xato yuz berdi. Iltimos, qayta urinib ko'ring.");
      toast.error("Bolani qo'shishda xato yuz berdi.");
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
                onClick={() => navigate('/kindergarten')}
                className="text-white hover:text-indigo-200 transition-colors duration-200 flex items-center p-2 rounded-full hover:bg-indigo-700"
                aria-label="Ortga qaytish"
              >
                <FiArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-center flex-grow">Yangi bola qo'shish</h2>
              <div className="w-8"></div>
            </div>
            <div className="w-16 h-1 bg-indigo-300 mx-auto rounded-full"></div>
          </div>
          
          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleAddChild} className="space-y-5">
              
              {/* Ism Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ismi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required
                    disabled={loading}
                    placeholder="Bolaning ismini kiriting"
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
                  Familiyasi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    required
                    disabled={loading}
                    placeholder="Bolaning familiyasini kiriting"
                  />
                  {formData.lastName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiCheck className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Guruhni tanlash */}
              <div>
                <label htmlFor="selectedGroup" className="block text-sm font-medium text-gray-700 mb-2">
                  Guruhni tanlash <span className="text-red-500">*</span>
                </label>
                {isDataLoading ? (
                  <div className="flex items-center justify-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                    <FiLoader className="animate-spin mr-2" size={20} /> Guruhlar yuklanmoqda...
                  </div>
                ) : fetchError ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
                    <FiAlertTriangle className="mr-2" /> {fetchError}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="selectedGroup"
                      name="selectedGroup"
                      value={formData.selectedGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                      disabled={loading}
                    >
                      <option value="" disabled>Guruhni tanlang</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>{group.name}</option>
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
                disabled={loading || !formData.selectedGroup || !formData.name || !formData.lastName}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" size={18} />
                    Qo'shilmoqda...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-2" size={18} />
                    Bola qo'shish
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

export default AddChildPage;