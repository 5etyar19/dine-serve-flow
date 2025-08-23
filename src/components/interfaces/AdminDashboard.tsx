// AdminDashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Users, DollarSign, TrendingUp, Clock, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listenRecentOrders, OrderDoc } from "@/lib/orders";
import { insertMenuItems, insertTables } from "@/lib/seed";

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = listenRecentOrders((rows) => {
      setOrders(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const initializeData = async () => {
    setInitializing(true);
    try {
      await Promise.all([insertTables(), insertMenuItems()]);
      toast({ title: "Success", description: "Database initialized with sample data" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to initialize data", variant: "destructive" });
    } finally {
      setInitializing(false);
    }
  };

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0, accepted: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0,
    };
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    return statusCounts;
  }, [orders]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === "completed").reduce((s, o) => s + (o.totalAmount || 0), 0),
    [orders]
  );

  const mostDemandedItems = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        counts[it.name] = (counts[it.name] || 0) + (it.quantity || 0);
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
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
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">Restaurant Management & Analytics</p>
              </div>
            </div>
            <Button onClick={initializeData} disabled={initializing} variant="outline">
              {initializing ? "Initializing..." : "Initialize Data"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">
                  {ordersByStatus.pending + ordersByStatus.accepted + ordersByStatus.preparing + ordersByStatus.ready}
                </p>
              </div>
              <ChefHat className="w-8 h-8 text-warning" />
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{ordersByStatus.completed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="status">Order Status</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Most Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">
                              Table {order.tableNumber} - {order.customerName || "Guest"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <p className="text-lg font-bold text-primary mt-1">
                              ${order.totalAmount?.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Items: {order.items?.map((it) => `${it.name} (${it.quantity})`).join(", ")}
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No orders yet. Initialize data to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Most Demanded Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mostDemandedItems.length > 0 ? mostDemandedItems.map(([name, count], idx) => (
                    <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                        </div>
                        <span className="font-medium">{name}</span>
                      </div>
                      <Badge variant="outline">{count} orders</Badge>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No analytics data available yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="p-6 text-center">
                    <Badge className={`mb-4 ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
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
