import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// Ikonkalar
import { 
  FiHome, 
  FiUsers, 
  FiMessageSquare, 
  FiLogOut,
  FiUser,
  FiSettings,
  FiBook,
  FiCalendar,
  FiMenu,
  FiX,
  FiUserPlus,
  FiChevronRight,
  FiAward
} from 'react-icons/fi';

const Sidebar = ({ user }) => {
  const [role, setRole] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role);
          }
        } catch (error) {
          console.error("Rolni olishda xatolik:", error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      displayToast("Tizimdan muvaffaqiyatli chiqdingiz");
    } catch (error) {
      console.error("Tizimdan chiqishda xatolik yuz berdi:", error);
      displayToast("Chiqishda xatolik yuz berdi");
    }
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const toggleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const getMenuItems = () => {
    if (role === 'teacher') {
      return (
        <>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex items-center w-full p-3 rounded-lg transition-all duration-200 border ${
                isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
              }`
            }
            onClick={() => {
              displayToast('Bosh sahifa');
              setIsMobileMenuOpen(false);
            }}
          >
            <FiHome className="mr-3 text-lg text-indigo-600" />
            <span className="font-medium">Bosh Sahifa</span>
          </NavLink>
          
          <div className="relative">
            <button
              onClick={() => toggleExpand('sinflar')}
              className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 ${
                expandedItems['sinflar'] 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center">
                <FiBook className="mr-3 text-lg text-indigo-600" />
                <span className="font-medium">Sinflar Boshqaruvi</span>
              </div>
              <FiChevronRight className={`transform transition-transform ${expandedItems['sinflar'] ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedItems['sinflar'] && (
              <div className="ml-6 mt-1 space-y-1 overflow-hidden animate-fadeIn">
                <NavLink 
                  to="/all-sinif" 
                  className={({ isActive }) => 
                    `flex items-center w-full p-2 pl-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-indigo-50'
                    }`
                  }
                  onClick={() => {
                    displayToast('Barcha sinflar sahifasi');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="text-sm">Barcha Sinflar</span>
                </NavLink>
                
                <NavLink 
                  to="/add-students" 
                  className={({ isActive }) => 
                    `flex items-center w-full p-2 pl-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-indigo-50'
                    }`
                  }
                  onClick={() => {
                    displayToast('O‘quvchilarni qo‘shish sahifasi');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="text-sm">O'quvchi qo'shish</span>
                </NavLink>
              </div>
            )}
          </div>
          
          <NavLink 
            to="/lessons" 
            className={({ isActive }) => 
              `flex items-center w-full p-3 rounded-lg transition-all duration-200 border ${
                isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
              }`
            }
            onClick={() => {
              displayToast('O‘quvchilar ro‘yxati');
              setIsMobileMenuOpen(false);
            }}
          >
            <FiUsers className="mr-3 text-lg text-indigo-600" />
            <span className="font-medium">O'quvchilar</span>
          </NavLink>
          
          <NavLink 
            to="/chats" 
            className={({ isActive }) => 
              `flex items-center w-full p-3 rounded-lg transition-all duration-200 border ${
                isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
              }`
            }
            onClick={() => {
              displayToast('Xabar almashish');
              setIsMobileMenuOpen(false);
            }}
          >
            <FiMessageSquare className="mr-3 text-lg text-indigo-600" />
            <span className="font-medium">Chatlar</span>
          </NavLink>
        
      
        </>
      );
    } else if (role === 'kindergarten_teacher') {
      return (
        <>
          <NavLink 
            to="/kindergarten" 
            className={({ isActive }) => 
              `flex items-center w-full p-3 rounded-lg transition-all duration-200 border ${
                isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
              }`
            }
            onClick={() => {
              displayToast('Bosh sahifa');
              setIsMobileMenuOpen(false);
            }}
          >
            <FiHome className="mr-3 text-lg text-indigo-600" />
            <span className="font-medium">Bosh Sahifa</span>
          </NavLink>
          
          <div className="relative">
            <button
              onClick={() => toggleExpand('bogcha')}
              className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 ${
                expandedItems['bogcha'] 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              <div className="flex items-center">
                <FiUsers className="mr-3 text-lg text-indigo-600" />
                <span className="font-medium">Bog'cha Boshqaruvi</span>
              </div>
              <FiChevronRight className={`transform transition-transform ${expandedItems['bogcha'] ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedItems['bogcha'] && (
              <div className="ml-6 mt-1 space-y-1 overflow-hidden animate-fadeIn">
                <NavLink 
                  to="/children" 
                  className={({ isActive }) => 
                    `flex items-center w-full p-2 pl-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-indigo-50'
                    }`
                  }
                  onClick={() => {
                    displayToast('Bolalar ro‘yxati');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="text-sm">Bolalarni qo'shish</span>
                </NavLink>
                 <NavLink 
                  to="/all/children" 
                  className={({ isActive }) => 
                    `flex items-center w-full p-2 pl-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-indigo-50'
                    }`
                  }
                  onClick={() => {
                    displayToast('Bolalar ro‘yxati');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="text-sm">Barcha Bolalar</span>
                </NavLink>
              </div>
            )}
          </div>
          
          <NavLink 
            to="/chats" 
            className={({ isActive }) => 
              `flex items-center w-full p-3 rounded-lg transition-all duration-200 border ${
                isActive 
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-indigo-50 border-transparent hover:border-indigo-100'
              }`
            }
            onClick={() => {
              displayToast('Xabar almashish');
              setIsMobileMenuOpen(false);
            }}
          >
            <FiMessageSquare className="mr-3 text-lg text-indigo-600" />
            <span className="font-medium">Chatlar</span>
          </NavLink>
        </>
      );
    }
    
    // Agar rol aniqlanmagan bo'lsa
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <span>Yuklanmoqda...</span>
      </div>
    );
  };

  const getMobileMenuItems = () => {
    if (role === 'teacher') {
      return (
        <>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiHome className="text-lg mb-1" />
            <span>Bosh</span>
          </NavLink>
          
          <NavLink 
            to="/all-sinif" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiBook className="text-lg mb-1" />
            <span>Sinflar</span>
          </NavLink>
          
          <NavLink 
            to="/add-students" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiUserPlus className="text-lg mb-1" />
            <span>Qo'shish</span>
          </NavLink>
          
          <NavLink 
            to="/lessons" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiUsers className="text-lg mb-1" />
            <span>O'quvchilar</span>
          </NavLink>
          
          <NavLink 
            to="/chats" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiMessageSquare className="text-lg mb-1" />
            <span>Chat</span>
          </NavLink>
          
          <div 
            className="flex flex-col items-center p-2 text-xs text-gray-600 cursor-pointer"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSignOut();
            }}
          >
            <FiLogOut className="text-lg mb-1" />
            <span>Chiqish</span>
          </div>
        </>
      );
    } else if (role === 'kindergarten_teacher') {
      return (
        <>
          <NavLink 
            to="/kindergarten" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiHome className="text-lg mb-1" />
            <span>Bosh</span>
          </NavLink>
          
          <NavLink 
            to="/children" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiUsers className="text-lg mb-1" />
            <span>Bolalar</span>
          </NavLink>
          
          <NavLink 
            to="/all/children" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
             <FiUsers className="text-lg mb-1" />
            <span>Barcha o'quvchilar</span>
          </NavLink>
          
          <NavLink 
            to="/chats" 
            className={({ isActive }) => 
              `flex flex-col items-center p-2 text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`
            }
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiMessageSquare className="text-lg mb-1" />
            <span>Chat</span>
          </NavLink>
          
          <div 
            className="flex flex-col items-center p-2 text-xs text-gray-600 cursor-pointer"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSignOut();
            }}
          >
            <FiLogOut className="text-lg mb-1" />
            <span>Chiqish</span>
          </div>
        </>
      );
    }
    
    return null;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen bg-gradient-to-b from-white to-indigo-50 shadow-xl w-64 border-r border-indigo-100 fixed top-0 left-0">
        {/* Header */}
        <div className="p-5 border-b border-indigo-200 bg-white">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FiSettings className="text-indigo-600 text-xl" />
            </div>
            <h1 className="text-xl font-bold text-indigo-800 ml-3">
              O'qituvchi Paneli
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-1">
            Boshqaruv paneli
          </p>
        </div>
        
        {/* Asosiy menyu */}
        <div className="flex-1 overflow-y-auto py-4 px-4">
          <nav className="space-y-1">
            {getMenuItems()}
          </nav>
        </div>
        
        {/* Pastki qism (Footer) */}
        <div className="border-t border-indigo-200 p-4 bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-indigo-100 p-2 rounded-full">
              <FiUser className="text-indigo-600 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">
                {user?.displayName || "Foydalanuvchi"}
              </p>
              <p className="text-sm text-gray-500 capitalize truncate">
                {role === 'teacher' ? 'O‘qituvchi' : 
                 role === 'kindergarten_teacher' ? 'Bog‘cha tarbiyachisi' : 
                 'Foydalanuvchi'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut} 
            className="flex items-center justify-center w-full p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FiLogOut className="mr-2" />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {getMobileMenuItems()}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Mobile Full Screen Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 flex flex-col">
          <div className="p-5 border-b border-indigo-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <FiSettings className="text-indigo-600 text-xl" />
                </div>
                <h1 className="text-xl font-bold text-indigo-800 ml-3">
                  O'qituvchi Paneli
                </h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <FiX className="text-gray-500 text-xl" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 ml-1">
              Boshqaruv paneli
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <nav className="space-y-1">
              {getMenuItems()}
            </nav>
          </div>
          
          <div className="border-t border-indigo-200 p-4 bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-full">
                <FiUser className="text-indigo-600 text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {user?.displayName || "Foydalanuvchi"}
                </p>
                <p className="text-sm text-gray-500 capitalize truncate">
                  {role === 'teacher' ? 'O‘qituvchi' : 
                   role === 'kindergarten_teacher' ? 'Bog‘cha tarbiyachisi' : 
                   'Foydalanuvchi'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }} 
              className="flex items-center justify-center w-full p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FiLogOut className="mr-2" />
              <span>Tizimdan chiqish</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast komponenti */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
          <div className="flex items-center">
            <FiSettings className="mr-2" />
            {toastMessage}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;