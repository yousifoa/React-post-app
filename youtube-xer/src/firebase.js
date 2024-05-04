
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'


const firebaseConfig = {

  apiKey: "apiKey",

  authDomain: "authDomain",

  projectId: "projectId",

  storageBucket: "storageBucket",

  messagingSenderId: "messagingSenderId",

  appId: "1: appId:web:0e434773eb87a619fb6b3a",

  measurementId: "measurementId"

};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export default auth;
export { db, collection, doc, setDoc, serverTimestamp, addDoc, auth, updateDoc, deleteDoc, storage };