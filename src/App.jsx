// src/App.jsx
import React, { useState, useEffect, cloneElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import Dashboard from './Components/Dashboard/Dashboard';
import Sidebar from './Components/Sidebar/Sidebar';
import Classes from './Components/Classes/Classes';
import ClassDetails from './Components/Classes/ClassDetails';
import AddStudentModal from './Components/AddStudentModal/AddStudentModal'; 
import Students from './Components/Students/Students';
import Chats from './Components/Chats/Chats';
import ChatWindow from './Components/Chats/ChatWindow';
import Kindergarten from './Components/KindergartenDashboard/KindergartenDashboard';
import AddChildModal from './Components/AddChildModal/AddChildModal';
import AllUsers from './Components/AllUsers/AllUsers';

const MainLayout = ({ user, userRole, children }) => (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar user={user} userRole={userRole} />
    <div className="flex-1 pl-64 cont">{children && cloneElement(children, { user, userRole })}</div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);

          if (role === 'teacher') {
            const classesSnapshot = await getDocs(collection(db, 'classes'));
            const classesList = classesSnapshot.docs.map(doc => ({
              id: doc.id,
              className: `${doc.data().number}-${doc.data().name}`,
              ...doc.data()
            }));
            setClasses(classesList);
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/register" element={user ? <Navigate to={userRole === 'teacher' ? "/dashboard" : "/kindergarten"} /> : <Register />} />
        <Route path="/login" element={user ? <Navigate to={userRole === 'teacher' ? "/dashboard" : "/kindergarten"} /> : <Login />} />

        {/* Teacher */}
        <Route path="/dashboard" element={user && userRole === 'teacher' ? <MainLayout user={user} userRole={userRole}><Dashboard classes={classes} /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/all-sinif" element={user && userRole === 'teacher' ? <MainLayout user={user} userRole={userRole}><Classes /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/add-students" element={user && userRole === 'teacher' ? <MainLayout user={user} userRole={userRole}>< AddStudentModal/></MainLayout> : <Navigate to="/login" />} />
        <Route path="/classes/:classId" element={user && userRole === 'teacher' ? <MainLayout user={user} userRole={userRole}><ClassDetails /></MainLayout> : <Navigate to="/login" />} />

        {/* Kindergarten */}
        <Route path="/kindergarten" element={user && userRole === 'kindergarten_teacher' ? <MainLayout user={user} userRole={userRole}><Kindergarten /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/children" element={user && userRole === 'kindergarten_teacher' ? <MainLayout user={user} userRole={userRole}><AddChildModal /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/all/children" element={user && userRole === 'kindergarten_teacher' ? <MainLayout user={user} userRole={userRole}><AllUsers /></MainLayout> : <Navigate to="/login" />} />

        {/* Common */}
        <Route path="/lessons" element={user ? <MainLayout user={user} userRole={userRole}><Students /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/chats" element={user ? <MainLayout user={user} userRole={userRole}><Chats /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/chats/:chatId" element={user ? <MainLayout user={user} userRole={userRole}><ChatWindow /></MainLayout> : <Navigate to="/login" />} />

        {/* Default */}
        <Route path="/" element={<Navigate to={user ? (userRole === 'teacher' ? "/dashboard" : "/kindergarten") : "/login"} />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
};

export default App;
