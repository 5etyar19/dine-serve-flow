import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CreditCard, Receipt, Users, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Table {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved';
}

interface Order {
  id: string;
  table_id: string;
  customer_name: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  tables: { table_number: number };
  order_items: Array<{
    quantity: number;
    price_per_item: number;
    menu_items: { name: string };
  }>;
}

interface CashierInterfaceProps {
  onBack: () => void;
}

export const CashierInterface = ({ onBack }: CashierInterfaceProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTablesAndOrders();
    
    // Subscribe to real-time updates only if Supabase is configured
    if (supabase) {
      const ordersSubscription = supabase
        .channel('orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchTablesAndOrders();
        })
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, []);

  const fetchTablesAndOrders = async () => {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        // Use mock data when Supabase isn't configured
        setTables([]);
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (tablesError) throw tablesError;

      // Fetch orders with table and item details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number),
          order_items (
            quantity,
            price_per_item,
            menu_items (name)
          )
        `)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setTables(tablesData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (orderId: string) => {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        toast({
          title: "Demo Mode",
          description: "Connect Supabase to enable real payment processing",
        });
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Payment Processed",
        description: "Order has been completed successfully",
      });

      fetchTablesAndOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const getTableOrders = (tableId: string) => {
    return orders.filter(order => order.table_id === tableId);
  };

  const getTableTotal = (tableId: string) => {
    return getTableOrders(tableId).reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'occupied': return 'bg-destructive text-destructive-foreground';
      case 'reserved': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'accepted': return 'bg-primary text-primary-foreground';
      case 'preparing': return 'bg-secondary text-secondary-foreground';
      case 'ready': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedOrder = selectedTable ? getTableOrders(selectedTable) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cashier interface...</p>
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
                  Cashier Interface
                </h1>
                <p className="text-muted-foreground text-sm">Payment & Table Management</p>
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
          {/* Tables Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tables Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tables.map((table) => {
                    const tableOrders = getTableOrders(table.id);
                    const tableTotal = getTableTotal(table.id);
                    const hasOrders = tableOrders.length > 0;
                    
                    return (
                      <Card 
                        key={table.id}
                        className={`cursor-pointer transition-smooth hover:shadow-elegant ${
                          selectedTable === table.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-lg font-bold mb-2">
                            Table {table.table_number}
                          </div>
                          <Badge className={`mb-2 ${hasOrders ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}>
                            {hasOrders ? 'In Progress' : 'Available'}
                          </Badge>
                          {hasOrders && (
                            <div className="text-sm">
                              <p className="font-medium">${tableTotal.toFixed(2)}</p>
                              <p className="text-muted-foreground">{tableOrders.length} order(s)</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  {selectedTable ? `Table ${tables.find(t => t.id === selectedTable)?.table_number} Details` : 'Select a Table'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTable && selectedOrder.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold">
                                {order.customer_name || 'Guest'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.menu_items.name} x{item.quantity}</span>
                                <span>${(item.price_per_item * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-3" />

                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-primary">
                              ${order.total_amount.toFixed(2)}
                            </span>
                          </div>

                          {order.status === 'ready' && (
                            <Button 
                              className="w-full" 
                              onClick={() => processPayment(order.id)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Process Payment
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Table Total:</span>
                        <span className="text-xl font-bold text-primary">
                          ${getTableTotal(selectedTable).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : selectedTable && selectedOrder.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active orders for this table</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a table to view order details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};