// /src/lib/menu.ts
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, now } from "./firebase";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  createdAt?: Timestamp;
}

export function listenAvailableMenuItems(
  cb: (items: MenuItem[]) => void
) {
  const q = query(
    collection(db, "menu_items"),
    where("isAvailable", "==", true),
    orderBy("category"),
    orderBy("name")
  );

  return onSnapshot(q, (snap) => {
    const items: MenuItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MenuItem, "id">),
    }));
    cb(items);
  });
}

// Admin: create/update/delete menu items
export async function addMenuItem(input: Omit<MenuItem, "id" | "createdAt">) {
  await addDoc(collection(db, "menu_items"), {
    ...input,
    createdAt: now(),
  });
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>) {
  await updateDoc(doc(db, "menu_items", id), patch as any);
}

export async function deleteMenuItem(id: string) {
  await deleteDoc(doc(db, "menu_items", id));
}

// Upload image to Firebase Storage
export async function uploadMenuImage(file: File) {
  const fileRef = ref(storage, `menu/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
