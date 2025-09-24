// src/components/interfaces/AdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, BarChart3, DollarSign, TrendingUp, Clock, ChefHat,
  Plus, Edit, Trash2, Upload, QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMenu } from "@/contexts/MenuContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { db, storage, nowTs } from "@/lib/firebase";
import {
  addDoc, updateDoc, deleteDoc, doc, collection, onSnapshot, query, orderBy,
  setDoc, writeBatch, Timestamp, getDoc, runTransaction
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";


// ---------- Types ----------
interface OrderAnalytics {
  id: string;
  total_amount: number;
  status: string;
  created_at: any;
  items: Array<{ name: string; quantity: number; price_per_item?: number }>;
  table_number?: number;
}

interface MenuItemForm {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  category: string;
  image_url: string;
  image_file?: File | null;
}

interface Category { id: string; name: string; description?: string }
interface Table { id: string; table_number: number }

type DayTotals = {
  total_orders: number;
  revenue_completed: number;
  status_counts: {
    pending: number; accepted: number; preparing: number; ready: number; completed: number; cancelled: number;
    [k: string]: number;
  };
} | null;

// ---------- Helpers ----------
const TZ = "Asia/Amman";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const toDayKey = (d: Date) => dayFmt.format(d); // "YYYY-MM-DD"
const toDate = (v: any): Date => v?.toDate ? v.toDate() : (v instanceof Date ? v : new Date(v));

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const { menuItems, categories } = useMenu();
  const { t, isRTL } = useLanguage();

  // Orders (realtime, global)
  const [orders, setOrders] = useState<OrderAnalytics[]>([]);

  // Edit states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // Forms
  const [itemForm, setItemForm] = useState<MenuItemForm>({ 
    name: "", 
    name_ar: "", 
    description: "", 
    description_ar: "", 
    price: 0, 
    category: "", 
    image_url: "", 
    image_file: null 
  });
  const [categoryForm, setCategoryForm] = useState<{ name: string; name_ar: string; description: string; description_ar: string }>({ 
    name: "", 
    name_ar: "", 
    description: "", 
    description_ar: "" 
  });
  const [tableForm, setTableForm] = useState<{ table_number: number }>({ table_number: 0 });

  // Past Days tab
  const [pastDay, setPastDay] = useState<string>(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [pastDayOrders, setPastDayOrders] = useState<OrderAnalytics[]>([]);
  const [pastDayTotals, setPastDayTotals] = useState<DayTotals>(null);

  // Session tracking (persisted)
  const [currentDayKey, setCurrentDayKey] = useState<string>("");         // empty until loaded
  const [sessionStart, setSessionStart] = useState<Date | null>(null);    // null until loaded

  // Search & pagination
  const [itemSearch, setItemSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const itemsPerPage = 4;
  const [itemPage, setItemPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);



  const [selectedMonth, setSelectedMonth] = useState(""); // Add this near your existing useState calls


  // ---------- Pagination helpers ----------
  const paginate = (array: any[], page: number) => {
    const start = (page - 1) * itemsPerPage;
    return array.slice(start, start + itemsPerPage);
  };
  const pageCount = (array: any[]) => Math.ceil(array.length / itemsPerPage);

  // ---------- Upload helper ----------
  async function uploadImageIfAny(file?: File | null): Promise<string> {
    if (!file) return "";
    const key = `item-images/${Date.now()}-${file.name}`;
    const r = ref(storage, key);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  }

  // ---------- QR helper ----------
  async function generateAndDownloadTableQR(tableNumber: number, alsoUpload = false) {
    const url = `${window.location.origin}/t/${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 512 });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `table-${tableNumber}-qr.png`;
    a.click();

    if (alsoUpload) {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `qr-codes/table-${tableNumber}.png`;
      const r = ref(storage, path);
      await uploadBytes(r, blob);
      const qrUrl = await getDownloadURL(r);
      toast({ title: "QR uploaded", description: qrUrl });
      return qrUrl;
    }
    return null;
  }

  // ---------- CRUD: Items ----------
  async function createItem() {
    try {
      const imageUrl = await uploadImageIfAny(itemForm.image_file);
      await addDoc(collection(db, "items"), {
        name: itemForm.name,
        name_ar: itemForm.name_ar,
        description: itemForm.description,
        description_ar: itemForm.description_ar,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
        is_available: true,
        is_vegetarian: false,
        created_at: nowTs(),
      });
      setItemForm({ name: "", name_ar: "", description: "", description_ar: "", price: 0, category: "", image_url: "", image_file: null });
      toast({ title: "Item created" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create item", variant: "destructive" });
    }
  }

  async function updateItem() {
    if (!editingItemId) return;
    try {
      let imageUrl = itemForm.image_url;
      if (itemForm.image_file) imageUrl = await uploadImageIfAny(itemForm.image_file);
      await updateDoc(doc(db, "items", editingItemId), {
        name: itemForm.name,
        name_ar: itemForm.name_ar,
        description: itemForm.description,
        description_ar: itemForm.description_ar,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
      });
      setEditingItemId(null);
      setItemForm({ name: "", name_ar: "", description: "", description_ar: "", price: 0, category: "", image_url: "", image_file: null });
      toast({ title: "Item updated" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to update item", variant: "destructive" });
    }
  }

  async function deleteItem(id: string) {
    try {
      await deleteDoc(doc(db, "items", id));
      toast({ title: "Item deleted" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  }

  // ---------- CRUD: Categories ----------
  async function createCategory() {
    try {
      await addDoc(collection(db, "categories"), {
        name: categoryForm.name,
        name_ar: categoryForm.name_ar,
        description: categoryForm.description,
        description_ar: categoryForm.description_ar,
        created_at: nowTs(),
      });
      setCategoryForm({ name: "", name_ar: "", description: "", description_ar: "" });
      toast({ title: "Category created" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  }

  async function updateCategory() {
    if (!editingCategoryId) return;
    try {
      await updateDoc(doc(db, "categories", editingCategoryId), {
        name: categoryForm.name,
        name_ar: categoryForm.name_ar,
        description: categoryForm.description,
        description_ar: categoryForm.description_ar,
      });
      setEditingCategoryId(null);
      setCategoryForm({ name: "", name_ar: "", description: "", description_ar: "" });
      toast({ title: "Category updated" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  }

  async function deleteCategory(id: string) {
    try {
      await deleteDoc(doc(db, "categories", id));
      toast({ title: "Category deleted" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  }

  // ---------- CRUD: Tables ----------
  async function createTable() {
    try {
      await addDoc(collection(db, "tables"), {
        table_number: Number(tableForm.table_number || 0),
        status: "available",
        created_at: nowTs(),
      });
      setTableForm({ table_number: 0 });
      toast({ title: "Table created" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create table", variant: "destructive" });
    }
  }

  async function updateTable() {
    if (!editingTableId) return;
    try {
      await updateDoc(doc(db, "tables", editingTableId), {
        table_number: Number(tableForm.table_number || 0),
      });
      setEditingTableId(null);
      setTableForm({ table_number: 0 });
      toast({ title: "Table updated" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to update table", variant: "destructive" });
    }
  }

  async function deleteTable(id: string) {
    try {
      await deleteDoc(doc(db, "tables", id));
      toast({ title: "Table deleted" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to delete table", variant: "destructive" });
    }
  }

  // ---------- Realtime: Orders (global) ----------
  useEffect(() => {
    const qy = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      const rows: OrderAnalytics[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          total_amount: data.total_amount || 0,
          status: data.status || "unknown",
          created_at: data.created_at,
          items: data.items || [],
          table_number: data.table_number,
        };
      });
      setOrders(rows);
    }, (err) => {
      console.error("Admin orders subscription error:", err);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    });
    return () => unsub();
  }, [toast]);

  // ---------- Persisted session: ensure doc exists once, then subscribe ----------
  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const settingsRef = doc(db, "settings", "current_day");
      const snap = await getDoc(settingsRef);

      if (!snap.exists()) {
        // First-time init only
        const now