// src/contexts/MenuContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // store the category name for simple filtering
  image_url?: string;
  is_vegetarian?: boolean;
  is_available?: boolean;
}

export interface Category { id: string; name: string; description?: string }
export interface Table { id: string; table_number: number; status?: "available"|"occupied"|"reserved" }

interface MenuContextValue {
  menuItems: MenuItem[];
  categories: Category[];
  tables: Table[];
  loading: boolean;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubItems = onSnapshot(
      query(collection(db, "items"), orderBy("name")),
      (snap) => {
        setMenuItems(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as MenuItem[]
        );
      }
    );

    const unsubCats = onSnapshot(
      query(collection(db, "categories"), orderBy("name")),
      (snap) => {
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Category[]
        );
      }
    );

    const unsubTables = onSnapshot(
      query(collection(db, "tables"), orderBy("table_number")),
      (snap) => {
        setTables(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Table[]
        );
      }
    );

    const timer = setTimeout(() => setLoading(false), 400); // small UX delay
    return () => { unsubItems(); unsubCats(); unsubTables(); clearTimeout(timer); };
  }, []);

  const value = useMemo(
    () => ({ menuItems, categories, tables, loading }),
    [menuItems, categories, tables, loading]
  );
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
