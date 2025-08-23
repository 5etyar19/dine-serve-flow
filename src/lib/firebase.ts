// /src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyDOw9lo3gaS3Xh4CZ2WP_dOg81pxKoGPeo",
  authDomain: "smartserve-96009.firebaseapp.com",
  projectId: "smartserve-96009",
  storageBucket: "smartserve-96009.firebasestorage.app",
  messagingSenderId: "582012881815",
  appId: "1:582012881815:web:ba00142ee7444cfb5552d2",
  measurementId: "G-GW1Z9F8FGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Exporting db so it can be used in other files
export { db };

// Function to fetch items from Firestore and sort by price in ascending order
async function getItemsSortedByPrice() {
  try {
    // Reference the collection in Firestore
    const itemsRef = collection(db, 'menuItems');
    
    // Create a query to sort items by the 'price' field in ascending order
    const q = query(itemsRef, orderBy('price', 'asc'));

    // Fetch the data from Firestore
    const querySnapshot = await getDocs(q);
    
    // Loop through the documents and log the data
    querySnapshot.forEach((doc) => {
      console.log(doc.id, ' => ', doc.data());
    });
  } catch (error) {
    console.error('Error fetching items:', error);
  }
}

// Call the function to fetch and display sorted items
getItemsSortedByPrice();


export const storage = getStorage(app);
export const now = serverTimestamp;   // use as now()
