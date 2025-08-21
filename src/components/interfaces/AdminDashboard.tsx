import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, insertMenuItems, insertTables } from "@/lib/supabase";
import { ArrowLeft, BarChart3, Users, DollarSign, TrendingUp, Clock, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderAnalytics {
  id: string;
  table_id: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  tables: { table_number: number };
  order_items: Array<{
    quantity: number;
    menu_items: { name: string };
  }>;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [orders, setOrders] = useState<OrderAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time updates only if Supabase is configured
    if (supabase) {
      const ordersSubscription = supabase
        .channel('admin-orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, []);

  const fetchOrders = async () => {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        // Use mock data when Supabase isn't configured
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number),
          order_items (
            quantity,
            menu_items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setInitializing(true);
    try {
      // Check if Supabase is configured
      if (!supabase) {
        toast({
          title: "Demo Mode",
          description: "Connect Supabase to initialize database with sample data",
        });
        return;
      }

      await Promise.all([
        insertTables(),
        insertMenuItems()
      ]);
      
      toast({
        title: "Success",
        description: "Database initialized with sample data",
      });
    } catch (error) {
      console.error('Error initializing data:', error);
      toast({
        title: "Error",
        description: "Failed to initialize data",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  const getRecentOrders = () => {
    return orders.slice(0, 10);
  };

  const getMostDemandedItems = () => {
    const itemCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.order_items.forEach(item => {
        const itemName = item.menu_items.name;
        itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getOrdersByStatus = () => {
    const statusCounts = {
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      statusCounts[order.status as keyof typeof statusCounts] = 
        (statusCounts[order.status as keyof typeof statusCounts] || 0) + 1;
    });

    return statusCounts;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'accepted': return 'bg-primary text-primary-foreground';
      case 'preparing': return 'bg-secondary text-secondary-foreground';
      case 'ready': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const recentOrders = getRecentOrders();
  const mostDemandedItems = getMostDemandedItems();
  const totalRevenue = getTotalRevenue();
  const ordersByStatus = getOrdersByStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
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
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Restaurant Management & Analytics</p>
              </div>
            </div>
            <Button 
              onClick={initializeData}
              disabled={initializing}
              variant="outline"
            >
              {initializing ? 'Initializing...' : 'Initialize Data'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">
                    {ordersByStatus.pending + ordersByStatus.accepted + ordersByStatus.preparing + ordersByStatus.ready}
                  </p>
                </div>
                <ChefHat className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{ordersByStatus.completed}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
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
                              Table {order.tables.table_number} - {order.customer_name || 'Guest'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <p className="text-lg font-bold text-primary mt-1">
                              ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Items: {order.order_items.map(item => 
                            `${item.menu_items.name} (${item.quantity})`
                          ).join(', ')}
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
                  {mostDemandedItems.length > 0 ? mostDemandedItems.map(([itemName, count], index) => (
                    <div key={itemName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <span className="font-medium">{itemName}</span>
                      </div>
                      <Badge variant="outline">
                        {count} orders
                      </Badge>
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