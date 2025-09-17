/* firebase-messaging-sw.js */
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js");

firebase.initializeApp({
   apiKey: "AIzaSyCkRSwRNewCa7cM2Jsy7BS2_H1vsGn9LrA",
  authDomain: "school-e09a3.firebaseapp.com",
  projectId: "school-e09a3",
  storageBucket: "school-e09a3.firebasestorage.app",
  messagingSenderId: "947420810827",
  appId: "1:947420810827:web:5e32d61e675df1188c87ce",
  measurementId: "G-8KKP4YN9N0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Background push keldi: ", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png"
  });
});
