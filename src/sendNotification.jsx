// sendNotification.js
import admin from "firebase-admin";

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const registrationTokens = [/* foydalanuvchilar tokenlari */];

admin.messaging().sendMulticast({
  tokens: registrationTokens,
  notification: {
    title: "Olib ketish so‘rovi",
    body: "Yangi so‘rov keldi, tasdiqlaysizmi?"
  }
});
