import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, auth, messaging } from '../../firebase'; // messaging ham qo‘shildi
import { IoArrowBackOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { FiLoader } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from "firebase/messaging";

const Chats = () => {
    const navigate = useNavigate();
    const [pickupRequests, setPickupRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    // 🔔 Push notification listener
    useEffect(() => {
        if (messaging) {
            onMessage(messaging, (payload) => {
                console.log("Push notification keldi:", payload);
                toast.info(`${payload.notification.title}: ${payload.notification.body}`);
            });
        }
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const requestsRef = collection(db, 'pickupRequests');
        const q = query(
            requestsRef,
            where('teacherId', '==', currentUser.uid),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const requestsData = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data(),
                    timestamp: document.data().timestamp?.toDate() || new Date(),
                }));
                setPickupRequests(requestsData);
                setLoading(false);
            },
            (error) => {
                console.error("Olib ketish so'rovlarini yuklashda xatolik: ", error);
                setLoading(false);
                toast.error("Olib ketish so'rovlarini yuklashda xatolik yuz berdi.");
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleUpdateStatus = useCallback(async (id, status, successMessage) => {
        try {
            await updateDoc(doc(db, 'pickupRequests', id), { status });

            // 🔔 So‘rovni yangilaganda push yuborish uchun backend’ga signal yuborasiz
            await fetch("https://YOUR_BACKEND_URL/sendNotification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Olib ketish so‘rovi",
                    body: successMessage,
                }),
            });

            toast.success(successMessage);
        } catch (error) {
            console.error(`So'rovni ${status} qilishda xatolik: `, error);
            toast.error("So'rovni yangilashda xatolik yuz berdi.");
        }
    }, []);

    const handleAcceptRequest = (id) =>
        handleUpdateStatus(id, 'accepted', "So'rov muvaffaqiyatli tasdiqlandi!");
    const handleRejectRequest = (id) =>
        handleUpdateStatus(id, 'rejected', "So'rov rad etildi.");

    const formatTimestamp = (date) => {
        if (!date) return 'Maʼlumot yoʻq';
        return date.toLocaleString('uz-UZ', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusTextAndColor = (status) => {
        switch (status) {
            case 'accepted':
                return { text: 'Tasdiqlangan', color: 'bg-green-100 text-green-700' };
            case 'rejected':
                return { text: 'Rad etilgan', color: 'bg-red-100 text-red-700' };
            default:
                return { text: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-700' };
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <header className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors"
                >
                    <IoArrowBackOutline className="text-xl" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Olinish so'rovlari</h1>
                <div className="w-10"></div>
            </header>

            {loading && (
                <div className="flex justify-center items-center h-64">
                    <FiLoader className="text-4xl text-blue-500 animate-spin" />
                </div>
            )}

            {!loading && pickupRequests.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                    <IoInformationCircleOutline className="text-5xl mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Hozircha olinish so'rovlari yo'q.</p>
                </div>
            )}

            {!loading && pickupRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <ul className="divide-y divide-gray-200">
                        {pickupRequests.map((request) => {
                            const { text, color } = getStatusTextAndColor(request.status);
                            return (
                                <li key={request.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="mb-2 sm:mb-0">
                                        <p className="text-lg font-semibold text-gray-900">{request.studentName}</p>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">{request.className}</span> sinfi
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            So'rov vaqti: {formatTimestamp(request.timestamp)}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {request.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                                                >
                                                    Tasdiqlash
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                                >
                                                    Rad etish
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${color}`}>
                                                {text}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default Chats;
