// /src/lib/seed.ts
import { db, now } from "./firebase";
import { doc, setDoc, writeBatch, collection } from "firebase/firestore";

export async function insertTables(count = 12) {
  const batch = writeBatch(db);
  for (let n = 1; n <= count; n++) {
    const ref = doc(db, "tables", String(n));
    batch.set(ref, { number: n, status: "available", updatedAt: now() });
  }
  await batch.commit();
}

export async function insertMenuItems() {
  const sample = [
    {
      name: "Signature Gourmet Burger",
      description:
        "Juicy beef patty with aged cheddar, caramelized onions, crispy bacon, and our special sauce on a brioche bun",
      price: 18.99,
      imageUrl: null,
      category: "Main Course",
      isVegetarian: false,
      isAvailable: true,
    },
    {
      name: "Fresh Caesar Salad",
      description:
        "Crisp romaine lettuce with grilled chicken, parmesan, croutons, and house-made Caesar dressing",
      price: 14.99,
      imageUrl: null,
      category: "Salads",
      isVegetarian: false,
      isAvailable: true,
    },
    {
      name: "Chocolate Decadence",
      description:
        "Rich dark chocolate mousse with fresh berries, whipped cream, and a delicate chocolate tuile",
      price: 12.99,
      imageUrl: null,
      category: "Desserts",
      isVegetarian: true,
      isAvailable: true,
    },
  ];

  const col = collection(db, "menu_items");
  for (const item of sample) {
    await setDoc(doc(col), { ...item, createdAt: now() });
  }
}
