import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, ChefHat, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMenu } from "@/contexts/MenuContext";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db, nowTs } from "@/lib/firebase";

type TableStatus = "available" | "occupied" | "reserved";

interface Table {
  id: string;
  table_number: number;
  status?: TableStatus;
}

type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";

interface OrderItem {
  item_id?: string;
  name: string;
  quantity: number;
  price_per_item: number;
  note?: string | null;
}

interface Order {
  id: string;
  table_number: number;
  customer_name: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: Timestamp | string;
  items: OrderItem[];
}

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

export const WaiterInterface = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const { menuItems, categories } = useMenu();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Realtime subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubTables = onSnapshot(collection(db, "tables"), (snap) => {
      const rows: Table[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setTables(rows);
    });

    const qOrders = query(
      collection(db, "orders"),
      where("status", "in", ACTIVE_STATUSES)
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const rows: Order[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setOrders(rows);
      setLoading(false);
    });

    return () => {
      unsubTables();
      unsubOrders();
    };
  }, []);

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [selectedTableId, tables]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, menuItems]);

  const handleItemClick = (itemId: string) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(itemId) || 0;
    newMap.set(itemId, current + 1);
    setSelectedItems(newMap);
  };

  const handleItemDecrement = (itemId: string) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(itemId) || 0;
    if (current > 1) {
      newMap.set(itemId, current - 1);
    } else {
      newMap.delete(itemId);
    }
    setSelectedItems(newMap);
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable || selectedItems.size === 0) return;

    try {
      const orderItems: OrderItem[] = [];
      let total = 0;

      selectedItems.forEach((quantity, itemId) => {
        const item = menuItems.find((m) => m.id === itemId);
        if (item) {
          orderItems.push({
            item_id: item.id,
            name: item.name,
            quantity,
            price_per_item: item.price,
            note: null,
          });
          total += item.price * quantity;
        }
      });

      await addDoc(collection(db, "orders"), {
        table_number: selectedTable.table_number,
        customer_name: null,
        status: "pending",
        total_amount: total,
        created_at: nowTs(),
        items: orderItems,
      });

      toast({
        title: "Order Created",
        description: `Order for Table ${selectedTable.table_number} has been submitted to kitchen`,
      });

      setSelectedItems(new Map());
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading waiter interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Waiter Interface
                </h1>
                <p className="text-muted-foreground text-sm">Order Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-primary">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tables Selection */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {tables
                    .slice()
                    .sort((a, b) => a.table_number - b.table_number)
                    .map((table) => {
                      const tableOrders = orders.filter(
                        (o) => o.table_number === table.table_number
                      );
                      const hasOrders = tableOrders.length > 0;
                      return (
                        <Card
                          key={table.id}
                          className={`cursor-pointer transition-smooth hover:shadow-elegant ${
                            selectedTableId === table.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => setSelectedTableId(table.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-lg font-bold mb-2">
                              Table {table.table_number}
                            </div>
                            <Badge
                              className={`${
                                hasOrders
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-success text-success-foreground"
                              }`}
                            >
                              {hasOrders ? "Active" : "Available"}
                            </Badge>
                            {hasOrders && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {tableOrders.length} order(s)
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="space-y-4">
                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5" />
                      Menu Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        onClick={() => setSelectedCategory(null)}
                        size="sm"
                      >
                        All Items
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.name ? "default" : "outline"}
                          onClick={() => setSelectedCategory(cat.name)}
                          size="sm"
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Items List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredItems.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No items available in this category
                        </p>
                      ) : (
                        filteredItems.map((item) => {
                          const quantity = selectedItems.get(item.id) || 0;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-smooth"
                            >
                              <div className="flex-1">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {item.category}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {quantity > 0 ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleItemDecrement(item.id)}
                                    >
                                      -
                                    </Button>
                                    <span className="font-bold w-8 text-center">
                                      {quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleItemClick(item.id)}
                                    >
                                      +
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleItemClick(item.id)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary */}
                {selectedItems.size > 0 && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle>Order Summary - Table {selectedTable.table_number}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
                          const item = menuItems.find((m) => m.id === itemId);
                          if (!item) return null;
                          return (
                            <div key={itemId} className="flex justify-between text-sm">
                              <span className="font-medium">
                                {item.name} x{quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSubmitOrder}
                        disabled={selectedItems.size === 0}
                      >
                        Submit Order to Kitchen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                      Please select a table to start creating an order
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
