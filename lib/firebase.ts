import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAbyArgGBTx8IKfxAAMAYPr74aic7xDauY",
  authDomain: "chat-x-by-dev-uzair.firebaseapp.com",
  databaseURL: "https://chat-x-by-dev-uzair-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-x-by-dev-uzair",
  storageBucket: "chat-x-by-dev-uzair.firebasestorage.app",
  messagingSenderId: "287208693423",
  appId: "1:287208693423:web:ec50fff441e6c71c8afe5a"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
