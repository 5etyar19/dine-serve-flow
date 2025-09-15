// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Plus, Minus } from "lucide-react";

// interface MenuItemProps {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   image: string;
//   category: string;

//   quantity?: number;
//   onQuantityChange?: (id: string, quantity: number) => void;
// }

// export const MenuCard = ({ 
//   id, 
//   name, 
//   description, 
//   price, 
//   image, 
//   category, 

//   quantity = 0,
//   onQuantityChange 
// }: MenuItemProps) => {
//   const [localQuantity, setLocalQuantity] = useState(quantity);

//   const handleQuantityChange = (newQuantity: number) => {
//     const finalQuantity = Math.max(0, newQuantity);
//     setLocalQuantity(finalQuantity);
//     onQuantityChange?.(id, finalQuantity);
//   };

//   return (
//     <Card className="overflow-hidden hover:shadow-elegant transition-smooth animate-fade-in group">
//       <div className="relative overflow-hidden">
//         <img 
//           src={image} 
//           alt={name}
//           className="w-full h-48 object-cover transition-smooth group-hover:scale-105"
//         />
        
//       </div>
      
//       <CardHeader className="pb-2">
//         <div className="flex justify-between items-start">
//           <div className="flex-1">
//             <CardTitle className="text-lg leading-tight">{name}</CardTitle>
//             <Badge variant="outline" className="mt-1 text-xs">
//               {category}
//             </Badge>
//           </div>
//           <div className="text-lg font-bold text-primary">
//             ${price.toFixed(2)}
//           </div>
//         </div>
//       </CardHeader>
      
//       <CardContent className="pt-0">
//         <CardDescription className="text-sm leading-relaxed mb-4">
//           {description}
//         </CardDescription>
        
//         <div className="flex items-center justify-between">
//           {localQuantity === 0 ? (
//             <Button 
//               variant="hero" 
//               onClick={() => handleQuantityChange(1)}
//               className="flex-1"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add to Order
//             </Button>
//           ) : (
//             <div className="flex items-center gap-3">
//               <Button 
//                 variant="quantity" 
//                 onClick={() => handleQuantityChange(localQuantity - 1)}
//               >
//                 <Minus className="w-4 h-4" />
//               </Button>
              
//               <span className="font-semibold text-lg min-w-[2rem] text-center">
//                 {localQuantity}
//               </span>
              
//               <Button 
//                 variant="quantity" 
//                 onClick={() => handleQuantityChange(localQuantity + 1)}
//               >
//                 <Plus className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };




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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMenu } from "@/contexts/MenuContext";
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
  items: Array<{ name: string; quantity: number; price_per_item?: number; arabic_name?: string; arabic_description?: string }>;
  table_number?: number;
}

interface MenuItemForm {
  name: string;
  arabic_name: string;
  arabic_description: string;
  description: string;
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

  // Orders (realtime, global)
  const [orders, setOrders] = useState<OrderAnalytics[]>([]);

  // Edit states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // Forms
  const [itemForm, setItemForm] = useState<MenuItemForm>({
    name: "",
    arabic_name: "",
    arabic_description: "",
    description: "",
    price: 0,
    category: "",
    image_url: "",
    image_file: null
  });
  const [categoryForm, setCategoryForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [tableForm, setTableForm] = useState<{ table_number: number }>({ table_number: 0 });

  // Past Days tab
  const [pastDay, setPastDay] = useState<string>(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [pastDayOrders, setPastDayOrders] = useState<OrderAnalytics[]>([]);
  const [pastDayTotals, setPastDayTotals] = useState<DayTotals>(null);

  // Session tracking (persisted)
  const [currentDayKey, setCurrentDayKey] = useState<string>("");
  const [sessionStart, setSessionStart] = useState<Date | null>(null);

  // Search & pagination
  const [itemSearch, setItemSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const itemsPerPage = 4;
  const [itemPage, setItemPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);

  const [selectedMonth, setSelectedMonth] = useState("");

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
        arabic_name: itemForm.arabic_name,
        arabic_description: itemForm.arabic_description,
        description: itemForm.description,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
        is_available: true,
        is_vegetarian: false,
        created_at: nowTs(),
      });
      setItemForm({
        name: "",
        arabic_name: "",
        arabic_description: "",
        description: "",
        price: 0,
        category: "",
        image_url: "",
        image_file: null
      });
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
        arabic_name: itemForm.arabic_name,
        arabic_description: itemForm.arabic_description,
        description: itemForm.description,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
      });
      setEditingItemId(null);
      setItemForm({
        name: "",
        arabic_name: "",
        arabic_description: "",
        description: "",
        price: 0,
        category: "",
        image_url: "",
        image_file: null
      });
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
        description: categoryForm.description,
        created_at: nowTs(),
      });
      setCategoryForm({ name: "", description: "" });
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
        description: categoryForm.description,
      });
      setEditingCategoryId(null);
      setCategoryForm({ name: "", description: "" });
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
        const now = new Date();
        await setDoc(settingsRef, {
          day_key: toDayKey(now),
          started_at: Timestamp.fromDate(now),
        });
      }

      unsub = onSnapshot(settingsRef, (s) => {
        if (s.exists()) {
          const data = s.data() as any;
          setCurrentDayKey(data.day_key);
          setSessionStart(toDate(data.started_at));
        }
      });
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  // ---------- Derived: Orders in Session ----------
  const effectiveSessionStart = sessionStart ?? new Date(0);
  const ordersInSession = useMemo(
    () => orders.filter(o => toDate(o.created_at) >= effectiveSessionStart),
    [orders, effectiveSessionStart]
  );

  // ---------- Past Days tab ----------
  useEffect(() => {
    if (!pastDay) return;
    const dayRef = doc(db, "past_days", pastDay);

    const unsubDay = onSnapshot(dayRef, (snap) => {
      const data = snap.data() as any;
      if (data?.totals) {
        setPastDayTotals({
          total_orders: data.totals.total_orders || 0,
          revenue_completed: data.totals.revenue_completed || 0,
          status_counts: {
            pending: data.totals.status_counts?.pending || 0,
            accepted: data.totals.status_counts?.accepted || 0,
            preparing: data.totals.status_counts?.preparing || 0,
            ready: data.totals.status_counts?.ready || 0,
            completed: data.totals.status_counts?.completed || 0,
            cancelled: data.totals.status_counts?.cancelled || 0,
          }
        });
      } else {
        setPastDayTotals(null);
      }
    });

    const ordersRef = collection(dayRef, "orders");
    const qy = query(ordersRef, orderBy("created_at", "desc"));
    const unsubOrders = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as OrderAnalytics[];
      setPastDayOrders(rows);
    });

    return () => { unsubDay(); unsubOrders(); };
  }, [pastDay]);

  // ---------- Computed metrics ----------
  const sessionTotalRevenue = useMemo(
    () => ordersInSession.filter(o => o.status === "completed")
      .reduce((s, o) => s + (o.total_amount || 0), 0),
    [ordersInSession]
  );

  const sessionOrdersByStatus = useMemo(() => {
    return ordersInSession.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, { pending: 0, accepted: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 } as any);
  }, [ordersInSession]);

  const taxRate = 0.16;
  const sessionTotalTax = useMemo(
    () => ordersInSession.filter(o => o.status === "completed")
      .reduce((sum, o) => sum + (o.total_amount || 0) * taxRate, 0),
    [ordersInSession]
  );

  const sessionRevenueAfterTax = useMemo(
    () => sessionTotalRevenue - sessionTotalTax,
    [sessionTotalRevenue, sessionTotalTax]
  );

  const completedInSession = sessionOrdersByStatus.completed || 0;
  const activeInSession = (sessionOrdersByStatus.pending || 0)
    + (sessionOrdersByStatus.accepted || 0)
    + (sessionOrdersByStatus.preparing || 0)
    + (sessionOrdersByStatus.ready || 0);

  const pastDayRevenue = pastDayTotals
    ? pastDayTotals.revenue_completed
    : pastDayOrders.filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "accepted": return "bg-primary text-primary-foreground";
      case "preparing": return "bg-secondary text-secondary-foreground";
      case "ready": return "bg-success text-success-foreground";
      case "completed": return "bg-success text-success-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // ---------- End Day ----------
  async function endDay() {
    try {
      if (!sessionStart) return;

      const sessionOrders = orders.filter(o => toDate(o.created_at) >= sessionStart);

      const statusCounts: Record<string, number> = {
        pending: 0, accepted: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0
      };
      let revenueCompleted = 0;
      for (const o of sessionOrders) {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        if (o.status === "completed") revenueCompleted += o.total_amount || 0;
      }

      const dayKey = toDayKey(sessionStart);
      const dayRef = doc(db, "past_days", dayKey);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(dayRef);
        const existing = snap.exists() ? (snap.data() as any) : null;

        const prevTotals = existing

