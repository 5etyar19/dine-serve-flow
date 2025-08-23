// Import Firebase and Firestore modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcwJD1T-PoT_O9ijvzfmGUxKFa1-C3jXk",
  authDomain: "habibahmenu-4a2be.firebaseapp.com",
  databaseURL: "https://habibahmenu-4a2be-default-rtdb.firebaseio.com",
  projectId: "habibahmenu-4a2be",
  storageBucket: "habibahmenu-4a2be.appspot.com",
  messagingSenderId: "317872042127",
  appId: "1:317872042127:web:e858ac36cd0e3a228280fa",
  measurementId: "G-CN482ZXGZX"
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


