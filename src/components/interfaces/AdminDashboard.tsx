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
  const [itemForm, setItemForm] = useState<MenuItemForm>({ name: "", description: "", price: 0, category: "", image_url: "", image_file: null });
  const [categoryForm, setCategoryForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
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
        description: itemForm.description,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
        is_available: true,
        is_vegetarian: false,
        created_at: nowTs(),
      });
      setItemForm({ name: "", description: "", price: 0, category: "", image_url: "", image_file: null });
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
        description: itemForm.description,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
      });
      setEditingItemId(null);
      setItemForm({ name: "", description: "", price: 0, category: "", image_url: "", image_file: null });
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
        // First-time init only
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
  const effectiveSessionStart = sessionStart ?? new Date(0); // guard until loaded
  const ordersInSession = useMemo(
    () => orders.filter(o => toDate(o.created_at) >= effectiveSessionStart),
    [orders, effectiveSessionStart]
  );

  // ---------- Past Days tab: listen to day totals & mirrored orders ----------
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
  // Dashboard (session-scoped)
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


  // ---------- Computed metrics (add after sessionTotalRevenue) ----------
const taxRate = 0.16; // 16% tax
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

  // Past day revenue (prefer aggregate if available)
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

    // Snapshot current session orders
    const sessionOrders = orders.filter(o => toDate(o.created_at) >= sessionStart);

    // Aggregate status counts and revenue for this session
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

    // --- ACCUMULATE totals atomically (no overwrite) ---
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(dayRef);
      const existing = snap.exists() ? (snap.data() as any) : null;

      const prevTotals = existing?.totals || {
        total_orders: 0,
        revenue_completed: 0,
        status_counts: {
          pending: 0, accepted: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0
        }
      };

      const newTotals = {
        total_orders: (prevTotals.total_orders || 0) + sessionOrders.length,
        revenue_completed: Number(((prevTotals.revenue_completed || 0) + revenueCompleted).toFixed(2)),
        status_counts: {
          pending:   (prevTotals.status_counts?.pending   || 0) + (statusCounts.pending   || 0),
          accepted:  (prevTotals.status_counts?.accepted  || 0) + (statusCounts.accepted  || 0),
          preparing: (prevTotals.status_counts?.preparing || 0) + (statusCounts.preparing || 0),
          ready:     (prevTotals.status_counts?.ready     || 0) + (statusCounts.ready     || 0),
          completed: (prevTotals.status_counts?.completed || 0) + (statusCounts.completed || 0),
          cancelled: (prevTotals.status_counts?.cancelled || 0) + (statusCounts.cancelled || 0),
        }
      };

      // Keep the earliest started_at; always bump ended_at
      const started_at = existing?.started_at ?? Timestamp.fromDate(sessionStart);

      tx.set(dayRef, {
        timezone: TZ,
        started_at,
        ended_at: nowTs(),
        totals: newTotals,
      }, { merge: true });
    });

    // Mirror session orders into subcollection (idempotent—same id overwrites the same doc)
    const batch = writeBatch(db);
    for (const o of sessionOrders) {
      const oref = doc(collection(dayRef, "orders"), o.id);
      batch.set(oref, { ...o, day_key: dayKey }, { merge: true });
    }
    await batch.commit();

    // Rotate session start to now (new session starts immediately)
    const nextStart = new Date();
    await setDoc(doc(db, "settings", "current_day"), {
      day_key: toDayKey(nextStart),
      started_at: Timestamp.fromDate(nextStart)
    }, { merge: true });

    setSessionStart(nextStart);
    toast({ title: "Day closed", description: `Archived ${sessionOrders.length} orders to ${dayKey}.` });
  } catch (e) {
    console.error(e);
    toast({ title: "End Day failed", description: "Please try again.", variant: "destructive" });
  }
}


  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">Restaurant Management & Analytics</p>
              </div>
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground mr-2">
                Session start:&nbsp;
                <span className="font-medium">
                  {sessionStart ? sessionStart.toLocaleString() : "Loading…"}
                </span>
              </div>
              <Button variant="outline" onClick={endDay} disabled={!sessionStart}>End Day</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Session-scoped Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">

        <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{activeInSession}</p>
                </div>
                <ChefHat className="w-8 h-8 text-warning"/>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{ordersInSession.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary"/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">${sessionTotalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-success"/>
              </div>
            </CardContent>
          </Card>



            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tax (16%)</p>
                    <p className="text-2xl font-bold">${sessionTotalTax.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-destructive"/>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sales After Tax</p>
                    <p className="text-2xl font-bold">${sessionRevenueAfterTax.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success"/>
                </div>
              </CardContent>
            </Card>


          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedInSession}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary"/>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="status">Order Status</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="past-days">Past Days</TabsTrigger>
          </TabsList>

          {/* Items */}
          <TabsContent value="items">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />{editingItemId ? "Edit Item" : "Add New Item"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="item-name">Name</Label>
                    <Input id="item-name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Item name" />
                  </div>
                  <div>
                    <Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Item description" />
                  </div>
                  <div>
                    <Label htmlFor="item-price">Price</Label>
                    <Input id="item-price" type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="item-category">Category</Label>
                    <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item-image">Image</Label>
                    <div className="flex gap-2">
                      <input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f) setItemForm({ ...itemForm, image_file: f, image_url: URL.createObjectURL(f) });
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("item-image")?.click()} className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />{itemForm.image_url ? "Change Image" : "Upload Image"}
                      </Button>
                    </div>
                    {itemForm.image_url && (<div className="mt-2"><img src={itemForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" /></div>)}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingItemId ? updateItem : createItem} className="flex-1">
                      {editingItemId ? "Update Item" : "Create Item"}
                    </Button>
                    {editingItemId && (
                      <Button variant="outline" onClick={() => { setEditingItemId(null); setItemForm({ name: "", description: "", price: 0, category: "", image_url: "", image_file: null }); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Menu Items ({menuItems.length})</CardTitle></CardHeader>
                <CardContent>
                  {/* Search bar */}
                  <div className="mb-3">
                    <Input
                      placeholder="Search items..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {paginate(menuItems.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase())), itemPage)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-sm font-medium text-primary">${item.price.toFixed(2)} • {item.category}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItemId(item.id);
                                setItemForm({
                                  name: item.name,
                                  description: item.description,
                                  price: item.price,
                                  category: item.category,
                                  image_url: item.image_url || "",
                                  image_file: null,
                                });
                              }}
                            ><Edit className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}

                    {/* Pagination Controls */}
                    {pageCount(menuItems.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()))) > 1 && (
                      <div className="flex justify-center gap-2 mt-3">
                        {Array.from({ length: pageCount(menuItems.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()))) }, (_, i) => (
                          <Button key={i} size="sm" variant={itemPage === i + 1 ? "default" : "outline"} onClick={() => setItemPage(i + 1)}>{i + 1}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />{editingCategoryId ? "Edit Category" : "Add New Category"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Name</Label>
                    <Input id="category-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Category name" />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Input id="category-description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Category description" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingCategoryId ? updateCategory : createCategory} className="flex-1">
                      {editingCategoryId ? "Update Category" : "Create Category"}
                    </Button>
                    {editingCategoryId && (
                      <Button variant="outline" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: "", description: "" }); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Categories ({categories.length})</CardTitle></CardHeader>
                <CardContent>
                  {/* Search bar */}
                  <div className="mb-3">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {paginate(categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())), categoryPage)
                      .map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingCategoryId(c.id); setCategoryForm({ name: c.name, description: c.description || "" }); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteCategory(c.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}

                    {/* Pagination Controls */}
                    {pageCount(categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))) > 1 && (
                      <div className="flex justify-center gap-2 mt-3">
                        {Array.from({ length: pageCount(categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))) }, (_, i) => (
                          <Button key={i} size="sm" variant={categoryPage === i + 1 ? "default" : "outline"} onClick={() => setCategoryPage(i + 1)}>{i + 1}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tables */}
          <TabsContent value="tables">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />{editingTableId ? "Edit Table" : "Add New Table"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="table-number">Table Number</Label>
                    <Input
                      id="table-number"
                      type="number"
                      value={tableForm.table_number}
                      onChange={(e) => setTableForm({ ...tableForm, table_number: parseInt(e.target.value) })}
                      placeholder="Table number"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingTableId ? updateTable : createTable} className="flex-1">
                      {editingTableId ? "Update Table" : "Create Table"}
                    </Button>
                    {editingTableId && (
                      <Button variant="outline" onClick={() => { setEditingTableId(null); setTableForm({ table_number: 0 }); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tables list with QR button */}
              <Card>
                <CardHeader><CardTitle>Tables</CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <Input
                      id="table-search"
                      placeholder="Search table..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                  </div>

                  <RealtimeTables
                    onEdit={(id, n) => { setEditingTableId(id); setTableForm({ table_number: n }); }}
                    onDelete={(id) => deleteTable(id)}
                    onGenerateQR={(n) => generateAndDownloadTableQR(n)}
                    searchFilter={tableSearch}
                    currentPage={tablePage}
                    setPage={setTablePage}
                    itemsPerPage={itemsPerPage}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders / Recent (SESSION) */}
          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/>Most Recent Orders</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ordersInSession.slice(0, 10).map((o) => (
                    <div key={o.id} className="flex justify-between items-center border rounded p-3">
                      <div>
                        <p className="font-medium">Table {o.table_number}</p>
                        <p className="text-sm text-muted-foreground">{toDate(o.created_at).toLocaleString()}</p>
                        <p className="text-sm">{o.items?.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(o.total_amount || 0).toFixed(2)}</p>
                        <Badge className={getStatusColor(o.status)}>{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {ordersInSession.length === 0 && (
                    <p className="text-muted-foreground text-center">No orders in this session yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics (GLOBAL — not reset by End Day) */}
          {/* Analytics (GLOBAL & TODAY) */}
<TabsContent value="analytics">
  <Tabs defaultValue="all-time" className="space-y-4">
    <TabsList className="grid grid-cols-2">
      <TabsTrigger value="all-time">All Time</TabsTrigger>
      <TabsTrigger value="today">Today</TabsTrigger>
    </TabsList>

    {/* All Time Analytics */}
    <TabsContent value="all-time">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />Most Demanded Items (All Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const counts = new Map<string, number>();
            orders.forEach(o =>
              (o.items || []).forEach(i =>
                counts.set(i.name, (counts.get(i.name) || 0) + (i.quantity || 0))
              )
            );
            const ranked = Array.from(counts.entries()).sort((a,b) => b[1] - a[1]).slice(0,10);
            return ranked.length ? (
              <div className="space-y-2">
                {ranked.map(([name, qty]) => (
                  <div key={name} className="flex justify-between">
                    <div>{name}</div>
                    <div className="font-medium">{qty}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No sales data yet</p>;
          })()}
        </CardContent>
      </Card>
    </TabsContent>

    {/* Today's Analytics */}
    <TabsContent value="today">
  <Card>
    <CardHeader className="flex justify-between items-center">
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />Today's Most Demanded Items
      </CardTitle>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => {
          const printContent = `
            <html>
              <head>
                <title>Today's Analytics</title>
                <style>
                  body { font-family: sans-serif; padding: 20px; }
                  h2 { margin-bottom: 10px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                </style>
              </head>
              <body>
                <h2>Today's Most Demanded Items</h2>
                <table>
                  <tr><th>Item</th><th>Quantity</th></tr>
                  ${Array.from(
                    (() => {
                      const counts = new Map<string, number>();
                      ordersInSession.forEach(o => 
                        (o.items || []).forEach(i => counts.set(i.name, (counts.get(i.name)||0)+i.quantity))
                      );
                      return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
                    })()
                  ).map(([name, qty]) => `<tr><td>${name}</td><td>${qty}</td></tr>`).join("")}
                </table>
                <h2>Summary</h2>
                <p>Total Revenue: $${sessionTotalRevenue.toFixed(2)}</p>
                <p>Total Tax (16%): $${sessionTotalTax.toFixed(2)}</p>
                <p>Revenue After Tax: $${sessionRevenueAfterTax.toFixed(2)}</p>
              </body>
            </html>
          `;
          const w = window.open('', '', 'width=800,height=600');
          w?.document.write(printContent);
          w?.document.close();
          w?.print();
        }}
      >
        Print / Export
      </Button>
    </CardHeader>
    <CardContent>
      {(() => {
        const counts = new Map<string, number>();
        ordersInSession.forEach(o =>
          (o.items || []).forEach(i =>
            counts.set(i.name, (counts.get(i.name) || 0) + (i.quantity || 0))
          )
        );
        const ranked = Array.from(counts.entries()).sort((a,b) => b[1] - a[1]).slice(0,10);
        return ranked.length ? (
          <div className="space-y-2">
            {ranked.map(([name, qty]) => (
              <div key={name} className="flex justify-between">
                <div>{name}</div>
                <div className="font-medium">{qty}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No orders today</p>;
      })()}
    </CardContent>
  </Card>
</TabsContent>

  </Tabs>
</TabsContent>


          {/* Status (SESSION) */}
          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(sessionOrdersByStatus).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="p-6 text-center">
                    <Badge className={`mb-4 ${getStatusColor(status)}`}>{status[0].toUpperCase() + status.slice(1)}</Badge>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">Orders</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Past Days Orders Tab (reads from past_days) */}
          
<TabsContent value="past-days">
  <Card>
    <CardHeader className="flex justify-between items-center">
      <CardTitle>Past Days Orders</CardTitle>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          const printContent = `
            <html>
              <head>
                <title>Past Day Orders - ${pastDay}</title>
                <style>
                  body { font-family: sans-serif; padding: 20px; }
                  h2 { margin-bottom: 10px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                </style>
              </head>
              <body>
                <h2>Orders for ${pastDay}</h2>
                <table>
                  <tr><th>Table</th><th>Items</th><th>Status</th><th>Total</th></tr>
                  ${pastDayOrders.map(o => `
                    <tr>
                      <td>${o.table_number}</td>
                      <td>${o.items?.map(i => `${i.name} x${i.quantity}`).join(", ")}</td>
                      <td>${o.status}</td>
                      <td>$${(o.total_amount || 0).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                </table>
                <h2>Summary</h2>
                <p>Total Revenue: $${pastDayRevenue.toFixed(2)}</p>
              </body>
            </html>
          `;
          const w = window.open('', '', 'width=800,height=600');
          w?.document.write(printContent);
          w?.document.close();
          w?.print();
        }}
      >
        Print / Export
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="col-span-2">
          <Label htmlFor="past-day">Select Date</Label>
          <Input
            id="past-day"
            type="date"
            value={pastDay}
            onChange={(e) => setPastDay(e.target.value)}
          />
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Sales for {pastDay}</div>
          <div className="text-2xl font-bold">${Number(pastDayRevenue || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-3">
        {pastDayOrders.length > 0 ? pastDayOrders.map((o) => (
          <div key={o.id} className="flex justify-between items-center border rounded p-3">
            <div>
              <p className="font-medium">Table {o.table_number}</p>
              <p className="text-sm text-muted-foreground">{toDate(o.created_at).toLocaleString()}</p>
              <p className="text-sm">{o.items?.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${(o.total_amount || 0).toFixed(2)}</p>
              <Badge className={getStatusColor(o.status)}>{o.status}</Badge>
            </div>
          </div>
        )) : <p className="text-muted-foreground">No orders found for this day</p>}
      </div>
    </CardContent>
  </Card>
</TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

// ---------- RealtimeTables ----------
function RealtimeTables({
  onEdit,
  onDelete,
  onGenerateQR,
  searchFilter,
  currentPage,
  setPage,
  itemsPerPage
}: {
  onEdit: (id: string, n: number) => void;
  onDelete: (id: string) => void;
  onGenerateQR: (tableNumber: number) => void;
  searchFilter: string;
  currentPage: number;
  setPage: (p: number) => void;
  itemsPerPage: number;
}) {
  const { tables } = useMenu();

  const filteredTables = tables.filter(t =>
    (`Table ${t.table_number}`).toLowerCase().includes(searchFilter.toLowerCase())
  );

  const pgCount = Math.ceil(filteredTables.length / itemsPerPage);
  const paginatedTables = filteredTables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-3">
      {paginatedTables.map((t) => (
        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1"><p className="font-medium">Table {t.table_number}</p></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(t.id, t.table_number)}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" title="Generate QR" onClick={() => onGenerateQR(t.table_number)}>
              <QrCode className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      {pgCount > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: pgCount }, (_, i) => (
            <Button key={i} size="sm" variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
