// KitchenInterface.tsx (Supabase removed)
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, X, Clock, ChefHat, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  table_id: string;
  customer_name: string | null;
  total_amount: number;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  tables: { table_number: number };
  order_items: Array<{
    quantity: number;
    price_per_item: number;
    menu_items: { name: string };
  }>;
}

interface KitchenInterfaceProps {
  onBack: () => void;
}

/* ---------------- Demo data + local API (replaces Supabase) --------------- */
let demoOrders: Order[] = [
  {
    id: "ord-1",
    table_id: "t-3",
    customer_name: "Guest",
    total_amount: 31.98,
    status: "pending",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    tables: { table_number: 3 },
    order_items: [
      { quantity: 1, price_per_item: 18.99, menu_items: { name: "Signature Gourmet Burger" } },
      { quantity: 1, price_per_item: 12.99, menu_items: { name: "Chocolate Decadence" } },
    ],
  },
  {
    id: "ord-2",
    table_id: "t-1",
    customer_name: null,
    total_amount: 14.99,
    status: "accepted",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    tables: { table_number: 1 },
    order_items: [{ quantity: 1, price_per_item: 14.99, menu_items: { name: "Fresh Caesar Salad" } }],
  },
];

const dataApi = {
  async getActiveKitchenOrders(): Promise<Order[]> {
    // return only kitchen-relevant statuses, oldest first
    return [...demoOrders]
      .filter((o) => ["pending", "accepted", "preparing", "ready"].includes(o.status))
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  },
  async updateOrderStatus(orderId: string, newStatus: Order["status"]): Promise<void> {
    demoOrders = demoOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
    );
  },
  subscribeOrders(_cb: () => void): () => void {
    // no realtime in demo mode
    return () => {};
  },
};
/* ------------------------------------------------------------------------- */

export const KitchenInterface = ({ onBack }: KitchenInterfaceProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const data = await dataApi.getActiveKitchenOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const unsub = dataApi.subscribeOrders(fetchOrders); // no-op in demo
    return () => unsub();
  }, []); // eslint-disable-line

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await dataApi.updateOrderStatus(orderId, newStatus);
      toast({ title: "Order Updated (Demo)", description: `Order status changed to ${newStatus}` });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "accepted":
        return "bg-primary text-primary-foreground";
      case "preparing":
        return "bg-secondary text-secondary-foreground";
      case "ready":
        return "bg-success text-success-foreground";
      case "completed":
        return "bg-success text-success-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading kitchen orders...</p>
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
                  Kitchen Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Order Management System</p>
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
        {orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-elegant transition-smooth animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Table {order.tables.table_number} - {order.customer_name || "Guest"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">
                          {item.menu_items.name} x{item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${(item.price_per_item * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">${order.total_amount.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "accepted")}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Order
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <Button className="w-full" onClick={() => updateOrderStatus(order.id, "preparing")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Start Preparing
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Ready
                      </Button>
                    )}

                    {order.status === "ready" && (
                      <div className="w-full text-center p-2 bg-success/10 rounded-lg">
                        <span className="text-success font-medium">Order Ready for Pickup</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
            <p className="text-muted-foreground">
              {orders.length === 0
                ? "No orders yet. Waiting for customers..."
                : "All orders are completed. Great work, chef!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
