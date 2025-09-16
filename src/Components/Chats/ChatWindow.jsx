// src/components/Teacher/ChatWindow.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, addDoc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { IoSend, IoArrowBackOutline } from "react-icons/io5";
import { FiUser, FiCheck, FiX, FiRefreshCcw, FiLoader } from "react-icons/fi";
import { toast } from 'react-toastify';

const ChatWindow = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatInfo, setChatInfo] = useState(null);
    const messagesEndRef = useRef(null);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }

        const chatDocRef = doc(db, 'chats', chatId);
        const unsubscribeChat = onSnapshot(chatDocRef, (doc) => {
            if (doc.exists()) {
                setChatInfo({ id: doc.id, ...doc.data() });
            }
        });

        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const q = query(messagesRef, orderBy('createdAt'));

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesData);
            setLoading(false);
        });

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    }, [chatId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const messagesRef = collection(db, `chats/${chatId}/messages`);
        await addDoc(messagesRef, {
            senderId: currentUser.uid,
            text: newMessage,
            createdAt: serverTimestamp(),
            type: 'text'
        });
        setNewMessage('');

        const chatDocRef = doc(db, 'chats', chatId);
        await updateDoc(chatDocRef, {
            lastMessageText: newMessage,
            lastMessageTime: serverTimestamp(),
            lastMessageRead: false,
            lastMessageSender: currentUser.uid
        });
    };

    const handleAcceptPickup = async (messageId) => {
        try {
            const messageDocRef = doc(db, `chats/${chatId}/messages`, messageId);
            await updateDoc(messageDocRef, {
                status: 'accepted'
            });
            toast.success("O'quvchi olib ketish uchun tayyorlandi.");
        } catch (err) {
            toast.error("Tasdiqlashda xatolik yuz berdi.");
        }
    };

    const handleRejectPickup = async (messageId) => {
        try {
            const messageDocRef = doc(db, `chats/${chatId}/messages`, messageId);
            await updateDoc(messageDocRef, {
                status: 'rejected'
            });
            toast.warn("O'quvchi olib ketish so'rovi rad etildi.");
        } catch (err) {
            toast.error("Rad etishda xatolik yuz berdi.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <FiLoader className="animate-spin h-12 w-12 text-indigo-600" />
                <p className="ml-3 text-lg font-medium text-gray-700">Yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 mr-4">
                    <IoArrowBackOutline size={24} />
                </button>
                {chatInfo && (
                    <div className="flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <FiUser className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{chatInfo.parentName}</h2>
                            <p className="text-sm text-gray-500">Ota-ona</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isMyMessage = message.senderId === currentUser.uid;
                    const isPickupRequest = message.type === 'pickupRequest';
                    const messageStatus = message.status;

                    return (
                        <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            {isPickupRequest ? (
                                <div className="p-4 rounded-lg bg-yellow-100 max-w-sm w-full shadow-md">
                                    <h3 className="font-semibold text-lg text-yellow-800 mb-2 flex items-center">
                                        <FiRefreshCcw className="mr-2 animate-spin-slow" /> Olib ketish so'rovi
                                    </h3>
                                    <p className="text-sm text-gray-700 mb-4">
                                        <span className="font-medium text-base">{message.studentName}</span> ni olib ketishni so'rashmoqda.
                                    </p>
                                    <div className="flex space-x-2">
                                        {messageStatus === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptPickup(message.id)}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                                >
                                                    <FiCheck className="mr-2" /> Tasdiqlash
                                                </button>
                                                <button
                                                    onClick={() => handleRejectPickup(message.id)}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <FiX className="mr-2" /> Rad etish
                                                </button>
                                            </>
                                        )}
                                        {messageStatus === 'accepted' && (
                                            <span className="flex-1 text-center text-green-600 font-semibold p-2">Tasdiqlandi <FiCheck className="inline-block" /></span>
                                        )}
                                        {messageStatus === 'rejected' && (
                                            <span className="flex-1 text-center text-red-600 font-semibold p-2">Rad etildi <FiX className="inline-block" /></span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className={`py-2 px-4 rounded-3xl max-w-xs md:max-w-md shadow-sm ${isMyMessage ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    <span className="break-words">{message.text}</span>
                                    {message.createdAt && (
                                        <span className={`block text-xs mt-1 ${isMyMessage ? 'text-gray-200' : 'text-gray-500'}`}>
                                            {new Date(message.createdAt.seconds * 1000).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 flex items-center border-t border-gray-100 sticky bottom-0 z-10">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
                    placeholder="Xabar yozing..."
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`ml-3 p-3 rounded-full transition-colors duration-200 ${
                        newMessage.trim() 
                            ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <IoSend size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;