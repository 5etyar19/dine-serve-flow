// src/components/interfaces/AdminDashboard.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, DollarSign, TrendingUp, Clock, ChefHat, Plus, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMenu } from "@/contexts/MenuContext";
import { db, storage, nowTs } from "@/lib/firebase";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface OrderAnalytics {
  id: string;
  table_id?: string;
  customer_name?: string | null;
  total_amount: number;
  status: string;
  created_at: string | any;
  tables?: { table_number: number };
  order_items: Array<{ quantity: number; menu_items: { name: string } }>;
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

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const { menuItems, categories } = useMenu();
  const [orders] = useState<OrderAnalytics[]>([]); // analytics placeholder – wire later if needed

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState<MenuItemForm>({ name: "", description: "", price: 0, category: "", image_url: "", image_file: null });
  const [categoryForm, setCategoryForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [tableForm, setTableForm] = useState<{ table_number: number }>({ table_number: 0 });

  // ---------- helpers ----------
  async function uploadImageIfAny(file?: File | null): Promise<string> {
    if (!file) return "";
    const key = `item-images/${Date.now()}-${file.name}`;
    const r = ref(storage, key);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  }

  // ---------- Items ----------
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

  // ---------- Categories ----------
  async function createCategory() {
    try {
      await addDoc(collection(db, "categories"), { name: categoryForm.name, description: categoryForm.description, created_at: nowTs() });
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
      await updateDoc(doc(db, "categories", editingCategoryId), { name: categoryForm.name, description: categoryForm.description });
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

  // ---------- Tables ----------
  async function createTable() {
    try {
      await addDoc(collection(db, "tables"), { table_number: Number(tableForm.table_number || 0), status: "available", created_at: nowTs() });
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
      await updateDoc(doc(db, "tables", editingTableId), { table_number: Number(tableForm.table_number || 0) });
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

  const ordersByStatus = { pending: 0, accepted: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 };
  const totalRevenue = 0;
  const mostDemandedItems: [string, number][] = [];

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">Restaurant Management & Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">0</p></div><BarChart3 className="w-8 h-8 text-primary"/></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p></div><DollarSign className="w-8 h-8 text-success"/></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Orders</p><p className="text-2xl font-bold">0</p></div><ChefHat className="w-8 h-8 text-warning"/></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Completed Today</p><p className="text-2xl font-bold">0</p></div><TrendingUp className="w-8 h-8 text-primary"/></div></CardContent></Card>
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="status">Order Status</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>

          {/* Items */}
          <TabsContent value="items">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />{editingItemId ? "Edit Item" : "Add New Item"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label htmlFor="item-name">Name</Label>
                    <Input id="item-name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Item name" />
                  </div>
                  <div><Label htmlFor="item-description">Description</Label>
                    <Input id="item-description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Item description" />
                  </div>
                  <div><Label htmlFor="item-price">Price</Label>
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {menuItems.map((item) => (
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
                  <div><Label htmlFor="category-name">Name</Label>
                    <Input id="category-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Category name" />
                  </div>
                  <div><Label htmlFor="category-description">Description</Label>
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {categories.map((c) => (
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
                  <div><Label htmlFor="table-number">Table Number</Label>
                    <Input
                      id="table-number"
                      type="number"
                      value={tableForm.table_number}
                      onChange={(e) => setTableForm({ ...tableForm, table_number: parseInt(e.target.value) || 0 })}
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

              {/* Simple list fed by context */}
              <Card>
                <CardHeader><CardTitle>Tables</CardTitle></CardHeader>
                <CardContent>
                  <RealtimeTables
                    onEdit={(id, n) => { setEditingTableId(id); setTableForm({ table_number: n }); }}
                    onDelete={(id) => deleteTable(id)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders / Analytics placeholders keep UI consistent */}
          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/>Most Recent Orders</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Connect orders next (customer places write to Firestore). This tab will auto-populate.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Most Demanded Items</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics will compute from the `orders` collection.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ordersByStatus).map(([status, count]) => (
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
        </Tabs>
      </div>
    </div>
  );
};

function RealtimeTables({ onEdit, onDelete }: { onEdit: (id: string, n: number) => void; onDelete: (id: string) => void }) {
  const { tables } = useMenu();
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {tables.map((t) => (
        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1"><p className="font-medium">Table {t.table_number}</p></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(t.id, t.table_number)}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}





