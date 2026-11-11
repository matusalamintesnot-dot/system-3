// 1. Copy this file to  firebase-config.js  (same folder) and fill in YOUR values
//    from Firebase Console > Project settings > Your apps > Web app.
// 2. Commit firebase-config.js. Firebase web config is NOT a secret:
//    Authentication + Firestore Security Rules are what protect the data.
// NEVER put a service-account key or Admin SDK private key in this project.
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
