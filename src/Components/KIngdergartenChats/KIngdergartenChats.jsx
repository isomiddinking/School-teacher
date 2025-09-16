// src/components/Chats/Chats.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Kindergartenchats = () => {
    const navigate = useNavigate();
    const [pickupRequests, setPickupRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const currentUser = auth.currentUser;

    const fetchRequestData = useCallback(async (requests) => {
        const parentIds = [...new Set(requests.map(req => req.parentId))];
        const childIds = [...new Set(requests.map(req => req.childId))];
        
        const parentPromises = parentIds.map(id => getDoc(doc(db, 'users', id)));
        const childPromises = childIds.map(id => getDoc(doc(db, 'children', id)));

        const [parentSnapshots, childSnapshots] = await Promise.all([
            Promise.all(parentPromises),
            Promise.all(childPromises)
        ]);

        const parents = parentSnapshots.reduce((acc, docSnap) => {
            if (docSnap.exists()) acc[docSnap.id] = docSnap.data().name;
            return acc;
        }, {});

        const children = childSnapshots.reduce((acc, docSnap) => {
            if (docSnap.exists()) acc[docSnap.id] = docSnap.data();
            return acc;
        }, {});

        return requests.map(req => ({
            ...req,
            parentName: parents[req.parentId] || 'Nomaʼlum ota-ona',
            childName: children[req.childId]?.name + ' ' + (children[req.childId]?.lastName || '') || 'Nomaʼlum bola'
        }));
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
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                setLoading(true);
                const requestsData = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data(),
                    timestamp: document.data().timestamp?.toDate() || new Date(),
                }));
                
                if (requestsData.length > 0) {
                    const detailedRequests = await fetchRequestData(requestsData);
                    setPickupRequests(detailedRequests);
                } else {
                    setPickupRequests([]);
                }

                setLoading(false);
            },
            (err) => {
                console.error("OnSnapshot xatosi: ", err);
                setError("Ma'lumotlarni yuklashda xato yuz berdi.");
                setLoading(false);
                toast.error("Ma'lumotlarni yuklashda xato yuz berdi.");
            }
        );

        return () => unsubscribe();
    }, [currentUser, fetchRequestData]);

    const handleUpdateStatus = useCallback(async (requestId, newStatus) => {
        try {
            const requestRef = doc(db, 'pickupRequests', requestId);
            await updateDoc(requestRef, { status: newStatus });
            toast.success(`So'rov muvaffaqiyatli ${newStatus === 'accepted' ? 'tasdiqlandi' : 'rad etildi'}!`);
        } catch (e) {
            console.error("Statusni yangilashda xato: ", e);
            toast.error("Statusni yangilashda xato yuz berdi.");
        }
    }, []);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { text: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-600', icon: <FiClock size={16} /> };
            case 'accepted':
                return { text: 'Tasdiqlangan', color: 'bg-green-100 text-green-600', icon: <FiCheckCircle size={16} /> };
            case 'rejected':
                return { text: 'Rad etilgan', color: 'bg-red-100 text-red-600', icon: <FiXCircle size={16} /> };
            default:
                return { text: 'Nomaʼlum', color: 'bg-gray-100 text-gray-600', icon: null };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <FiLoader className="animate-spin text-indigo-500 h-10 w-10" />
                <p className="mt-4 text-gray-600">So'rovlar yuklanmoqda...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <FiAlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Xatolik yuz berdi</h3>
                <p className="mt-2 text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Olib ketish uchun so'rovlar</h1>
            
            {pickupRequests.length > 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <ul className="divide-y divide-gray-200">
                        {pickupRequests.map((request) => {
                            const { text, color, icon } = getStatusInfo(request.status);
                            const formattedDate = new Intl.DateTimeFormat('uz-UZ', {
                                dateStyle: 'long',
                                timeStyle: 'short',
                            }).format(request.timestamp);
                            
                            return (
                                <li key={request.id} className="py-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-semibold text-gray-800 truncate">{request.childName}</p>
                                            <p className="text-sm text-gray-500 mt-1">Ota-ona: <span className="font-medium text-gray-600">{request.parentName}</span></p>
                                            <p className="text-sm text-gray-500 mt-1">Vaqt: <span className="font-medium text-gray-600">{formattedDate}</span></p>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                                            <span className={`flex items-center space-x-1 px-3 py-1 text-sm font-semibold rounded-lg ${color}`}>
                                                {icon}
                                                <span>{text}</span>
                                            </span>
                                            {request.status === 'pending' && (
                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleUpdateStatus(request.id, 'accepted')}
                                                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                    >
                                                        Tasdiqlash
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                                                    >
                                                        Rad etish
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <FiUsers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">Hali so'rovlar mavjud emas</h3>
                    <p className="mt-2 text-sm text-gray-500">Ota-onalar sizga so'rov yuborganlarida, ular bu yerda paydo bo'ladi.</p>
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default Kindergartenchats;