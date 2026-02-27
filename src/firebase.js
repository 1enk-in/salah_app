import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQfQSNrc6mcPlrbs_wlo508LDCM1uLay8",
  authDomain: "salah-companion-647eb.firebaseapp.com",
  projectId: "salah-companion-647eb",
  storageBucket: "salah-companion-647eb.firebasestorage.app",
  messagingSenderId: "369648488082",
  appId: "1:369648488082:web:32996c0b89e0f94590e04b",
  measurementId: "G-KTT606DMLD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
