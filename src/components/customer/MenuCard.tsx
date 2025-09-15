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
  items: Array<{ name: string; quantity: number; price_per_item?: number }>;
  table_number?: number;
}

interface MenuItemForm {
  name: string;
  arabic_name: string;
  arabic_description: string; // ✅ added
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
    arabic_description: "",   // ✅ included
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

  // ---------- CRUD: Items ----------
  async function createItem() {
    try {
      const imageUrl = await uploadImageIfAny(itemForm.image_file);
      await addDoc(collection(db, "items"), {
        name: itemForm.name,
        arabic_name: itemForm.arabic_name,
        arabic_description: itemForm.arabic_description, // ✅ save
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
        arabic_description: "", // ✅ reset
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
        arabic_description: itemForm.arabic_description, // ✅ update
        description: itemForm.description,
        price: Number(itemForm.price || 0),
        category: itemForm.category,
        image_url: imageUrl || "",
      });
      setEditingItemId(null);
      setItemForm({
        name: "",
        arabic_name: "",
        arabic_description: "", // ✅ reset
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

  // ... (UNCHANGED CODE for Categories, Tables, Orders, Analytics, Past Days, End Day, Realtime, etc.)

  // ---------- Example Fix in Edit Button ----------
  // inside Items list
  // (only showing relevant part)
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      setEditingItemId(item.id);
      setItemForm({
        name: item.name,
        arabic_name: (item as any).arabic_name || "",
        arabic_description: (item as any).arabic_description || "", // ✅ added
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url || "",
        image_file: null,
      });
    }}
  >
    <Edit className="w-4 h-4" />
  </Button>
};
