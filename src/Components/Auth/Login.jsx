// src/Components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 🔎 Foydalanuvchini Firestore'dan nomi bo‘yicha topish
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('name', '==', name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Bunday foydalanuvchi topilmadi.");
        toast.error("Bunday foydalanuvchi topilmadi.");
        setIsLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const userEmail = userData.email;
      const userRole = userData.role;

      if (!userRole) {
        setError("Foydalanuvchi roliga ega emas.");
        toast.error("Rol topilmadi.");
        setIsLoading(false);
        return;
      }

      // 🔑 Email va parol bilan login
      await signInWithEmailAndPassword(auth, userEmail, password);
      toast.success("Muvaffaqiyatli kirdingiz!");

      // 👨‍🏫 Rolga qarab yo‘naltirish
      if (userRole === 'teacher') {
        navigate('/dashboard');
      } else if (userRole === 'kindergarten_teacher') {
        navigate('/kindergarten');
      } else {
        setError("Noma'lum rol.");
        toast.error("Noma'lum rol.");
        navigate('/');
      }

    } catch (err) {
      console.error(err);
      setError("Noto'g'ri ism yoki parol.");
      toast.error("Noto'g'ri ism yoki parol.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Tizimga kirish</h2>
          <p className="mt-2 text-gray-600">Hisobingizga kiring</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Ism va familiya
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ism va familiya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Hisobingiz yo‘qmi?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Ro‘yxatdan o‘tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
