// /src/components/interfaces/KitchenInterface.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, X, Clock, ChefHat, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  listenKitchenOrders,
  updateOrderStatus,
  OrderDoc,
  OrderStatus,
} from "@/lib/orders";

interface KitchenInterfaceProps {
  onBack: () => void;
}

export const KitchenInterface = ({ onBack }: KitchenInterfaceProps) => {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = listenKitchenOrders((rows) => {
      setOrders(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const changeStatus = async (orderId: string, s: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, s);
      toast({ title: "Order Updated", description: `Order status changed to ${s}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold text-primary">{orders.length}</p>
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
                        Table {order.tableNumber} - {order.customerName || "Guest"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : ""}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-sm">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${(item.pricePerItem * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button className="flex-1" onClick={() => changeStatus(order.id!, "accepted")}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Order
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => changeStatus(order.id!, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <Button className="w-full" onClick={() => changeStatus(order.id!, "preparing")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Start Preparing
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button variant="success" className="w-full" onClick={() => changeStatus(order.id!, "ready")}>
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
            <p className="text-muted-foreground">No orders yet. Waiting for customers…</p>
          </div>
        )}
      </div>
    </div>
  );
};
