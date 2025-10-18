import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGcgxY4Tztoi3dSGki3ruO8zeDt9pLSlk",
  authDomain: "ruppdiun.firebaseapp.com",
  projectId: "ruppdiun",
  storageBucket: "ruppdiun.firebasestorage.app",
  messagingSenderId: "50801366553",
  appId: "1:50801366553:web:f1389a93451dbec737bc88"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
