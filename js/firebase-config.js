/* ============================================
   ACE Pilot Training Log
   Firebase Configuration
   ============================================ */

// Firebase configuration for "ACE Pilot Training Log" project
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyDsdIcxCT9GnjiCvBO-SdQEOpAxwewVmPs",
    authDomain: "ace-pilot-training-log.firebaseapp.com",
    projectId: "ace-pilot-training-log",
    storageBucket: "ace-pilot-training-log.firebasestorage.app",
    messagingSenderId: "270538490552",
    appId: "1:270538490552:web:8e81b7ef410e1f9540ea4d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Firestore settings
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser.');
    }
});
