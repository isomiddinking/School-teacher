// src/components/Auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [role, setRole] = useState('teacher'); // Default rolni 'teacher' qilib o'rnatamiz
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();

 const validateForm = () => {
  if (password !== confirmPassword) {
   setError("Parollar mos kelmadi");
   toast.error("Parollar mos kelmadi");
   return false;
  }
  
  if (password.length < 6) {
   setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
   toast.error("Parol kamida 6 belgidan iborat bo'lishi kerak");
   return false;
  }
  
  // Regex tekshiruvini aniqroq qilamiz
  if (!phone.match(/^\+998\d{9}$/)) { 
   setError("Iltimos, to'g'ri telefon raqamini kiriting (+998901234567)");
   toast.error("Iltimos, to'g'ri telefon raqamini kiriting");
   return false;
  }

  if (!name.trim()) {
   setError("Ism va familiya maydoni bo'sh bo'lishi mumkin emas.");
   toast.error("Ism va familiya maydoni bo'sh bo'lishi mumkin emas.");
   return false;
  }
  
  return true;
 };

 const handleRegister = async (e) => {
  e.preventDefault();
  setError('');
  
  if (!validateForm()) {
   return;
  }
  
  setIsLoading(true);

  // Foydalanuvchi nomidan avtomatik ravishda noyob email yaratish
  const userEmail = `${name.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random() * 10000)}@edu.uz`;

  try {
   const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
   const user = userCredential.user;

   await updateProfile(user, { displayName: name });

   await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: name,
    phone: phone,
    email: userEmail,
    role: role, // Tanlangan rolni Firestore'ga saqlash
    createdAt: new Date(),
   });

   toast.success("Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi!");
   
   // Yangi ro'yxatdan o'tgan foydalanuvchini roliga qarab yo'naltirish
   if (role === 'teacher') {
    navigate('/dashboard');
   } else if (role === 'kindergarten_teacher') {
    navigate('/kindergarten');
   }
  } catch (err) {
   console.error(err);
   setError("Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
   toast.error("Ro'yxatdan o'tishda xatolik yuz berdi");
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pt-10 pb-10">
   <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
    <div className="text-center">
     <h2 className="text-3xl font-bold text-gray-800">Ro'yxatdan o'tish</h2>
     <p className="mt-2 text-gray-600">Yangi hisob yarating</p>
    </div>
    
    <form className="space-y-6" onSubmit={handleRegister}>
     <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
       Ism va familiya
      </label>
      <input
       id="name"
       name="name"
       type="text"
       required
       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
       placeholder="Ism va familiyangizni kiriting"
       value={name}
       onChange={(e) => setName(e.target.value)}
      />
     </div>
     
     <div>
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
       Telefon raqami
      </label>
      <input
       id="phone"
       name="phone"
       type="tel"
       required
       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
       placeholder="+998901234567"
       value={phone}
       onChange={(e) => setPhone(e.target.value)}
      />
      <p className="mt-1 text-xs text-gray-500">Format: +998901234567</p>
     </div>
     
     <div>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
       Parol
      </label>
      <input
       id="password"
       name="password"
       type="password"
       required
       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
       placeholder="Kamida 6 ta belgi"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
      />
     </div>
     
     <div>
      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
       Parolni tasdiqlash
      </label>
      <input
       id="confirmPassword"
       name="confirmPassword"
       type="password"
       required
       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
       placeholder="Parolingizni takrorlang"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
      />
     </div>
     
     <div>
      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
       Rol
      </label>
      <select
       id="role"
       name="role"
       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
       value={role}
       onChange={(e) => setRole(e.target.value)}
      >
       <option value="teacher">Maktab o'qituvchisi</option>
       <option value="kindergarten_teacher">Bog'cha tarbiyachisi</option>
      </select>
     </div>
     
     {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
     
     <button
      type="submit"
      disabled={isLoading}
      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
       isLoading 
        ? 'bg-indigo-400 cursor-not-allowed' 
        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
      }`}
     >
      {isLoading ? 'Ro\'yxatdan o\'tish...' : 'Ro\'yxatdan o\'tish'}
     </button>
    </form>
    
    <div className="text-center">
     <p className="text-sm text-gray-600">
      Hisobingiz bormi?{' '}
      <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
       Kirish
      </Link>
     </p>
    </div>
   </div>
  </div>
 );
};

export default Register;