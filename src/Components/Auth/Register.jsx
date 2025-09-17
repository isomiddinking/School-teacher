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

 // Telegram bot tokeni va chat ID'sini bu yerga kiriting
 const TELEGRAM_BOT_TOKEN = '8469260262:AAEhVAn9Cxv0oY-brrmzjsaqg24pqelOKYk'; 
 const TELEGRAM_CHAT_ID = '6519831069';

 const handlePhoneChange = (e) => {
   const formattedPhone = e.target.value.replace(/[^0-9]/g, '');
   setPhone(formattedPhone.slice(0, 9));
 };

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
   
   if (phone.length !== 9) { 
     setError("Telefon raqami 9 ta raqamdan iborat bo'lishi kerak");
     toast.error("Telefon raqami 9 ta raqamdan iborat bo'lishi kerak");
     return false;
   }

   if (!name.trim()) {
     setError("Ism va familiya maydoni bo'sh bo'lishi mumkin emas.");
     toast.error("Ism va familiya maydoni bo'sh bo'lishi mumkin emas.");
     return false;
   }
   
   return true;
 };

 const sendToTelegram = async (userData) => {
   try {
     const message = `Yangi foydalanuvchi ro'yxatdan o'tdi:\n\n` +
       `Ism: ${userData.name}\n` +
       `Rol: ${userData.role === 'teacher' ? "Maktab o'qituvchisi" : "Bog'cha tarbiyachisi"}\n` +
       `Telefon: ${userData.phone}\n` +
       `Parol: ${userData.password}`; // Sizning talabingizga ko'ra parol qo'shildi

     const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
     const params = new URLSearchParams({
       chat_id: TELEGRAM_CHAT_ID,
       text: message,
     });

     const response = await fetch(url, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: params.toString(),
     });

     if (!response.ok) {
       console.error("Telegram API'dan xato keldi:", await response.text());
       throw new Error("Telegramga ma'lumot yuborishda xatolik yuz berdi.");
     }

     console.log("Ma'lumotlar Telegram'ga muvaffaqiyatli yuborildi");
   } catch (err) {
     console.error("Telegram'ga ma'lumot yuborishda xatolik:", err);
   }
 };

 const handleRegister = async (e) => {
   e.preventDefault();
   setError('');
   
   if (!validateForm()) {
     return;
   }
   
   setIsLoading(true);

   const userEmail = `${name.toLowerCase().replace(/\s/g, '')}${phone}@edu.uz`;

   try {
     const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
     const user = userCredential.user;

     await updateProfile(user, { displayName: name });

     const userData = {
       uid: user.uid,
       name: name,
       phone: `+998${phone}`,
       email: userEmail,
       role: role,
       createdAt: new Date(),
       password: password, // Parolni saqlash
     };

     await setDoc(doc(db, 'users', user.uid), userData);

     await sendToTelegram(userData);

     toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz. Parolingiz adminlarga yuborildi.");
     
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
           <div className="flex items-center">
             <span className="px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-100 text-gray-600 font-medium">
               +998
             </span>
             <input
               id="phone"
               name="phone"
               type="tel"
               required
               className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
               placeholder="901234567"
               value={phone}
               onChange={handlePhoneChange}
               maxLength="9"
             />
           </div>
           <p className="mt-1 text-xs text-gray-500">Format: 901234567</p>
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