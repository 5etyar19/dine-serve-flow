import { useEffect, useState, useRef } from "react";
import { collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, X, Clock, ChefHat, ArrowLeft, Bell, Flame, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/ui/language-toggle";

interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price_per_item: number;
  note?: string;
}

interface Order {
  id: string;
  table_number: number;
  customer_name: string | null;
  total_amount: number;
  status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
  created_at: any;
  updated_at?: any;
  items: OrderItem[];
  note?: string;
}

interface KitchenInterfaceProps {
  onBack: () => void;
}

export const KitchenInterface = ({ onBack }: KitchenInterfaceProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "In Progress" | "Ready">("All");
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderCount = useRef(0);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSuUy+/Mdxo9Kos7e2u8k3lm4v7JQZXhcPhyWKCOJYfB0E1Q');
    audioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setOrders(ordersData);
        
        // Play notification sound for new orders
        const currentPendingCount = ordersData.filter(o => o.status === "pending").length;
        if (currentPendingCount > previousOrderCount.current && previousOrderCount.current > 0) {
          audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
          toast({ 
            title: "🔔 New Order!", 
            description: "A new order has arrived", 
            className: "bg-amber-500 text-white border-0"
          });
        }
        previousOrderCount.current = currentPendingCount;
        
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch orders:", err);
        toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, [toast]);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus, updated_at: Timestamp.now() });
      toast({ 
        title: "Order Updated", 
        description: `Order status changed to ${newStatus}`,
        className: "bg-green-500 text-white border-0"
      });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-amber-500 text-white";
      case "accepted": return "bg-orange-500 text-white";
      case "preparing": return "bg-blue-500 text-white";
      case "ready": return "bg-green-500 text-white";
      case "completed": return "bg-green-600 text-white";
      case "cancelled": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // Hide cancelled and completed orders in kitchen view
  const activeOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "completed"
  );

  const filteredOrders = activeOrders.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Pending") return o.status === "pending";
    if (filter === "In Progress") return o.status === "accepted" || o.status === "preparing";
    if (filter === "Ready") return o.status === "ready";
    return true;
  });

  // Counters (only active orders count)
  const pendingCount = activeOrders.filter((o) => o.status === "pending").length;
  const inProgressCount = activeOrders.filter((o) => o.status === "accepted" || o.status === "preparing").length;
  const readyCount = activeOrders.filter((o) => o.status === "ready").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-white mx-auto mb-4"></div>
            <Flame className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-white text-lg font-medium">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-orange-700 border-b border-orange-600/50 shadow-2xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="secondary" onClick={onBack} className="bg-white/20 hover:bg-white/30 border-white/30">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UtensilsCrossed className="h-8 w-8" />
              {t('kitchenDashboard')}
            </h1>
            <p className="text-orange-100">{t('orderManagement')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="text-right">
              <p className="text-orange-200 text-sm">{t('activeOrders')}</p>
              <p className="text-3xl font-bold text-white">{activeOrders.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Status counters */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-xl shadow-elegant text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">{t('pending')}</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
            <Bell className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-orange-600 to-red-500 rounded-xl shadow-elegant text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">{t('inProgress')}</p>
              <p className="text-3xl font-bold">{inProgressCount}</p>
            </div>
            <Flame className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl shadow-elegant text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('ready')}</p>
              <p className="text-3xl font-bold">{readyCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="container mx-auto px-4 py-2 flex gap-3 overflow-x-auto">
        {(["All", "Pending", "In Progress", "Ready"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "secondary" : "outline"}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap transition-all ${
              filter === f 
                ? "bg-white text-orange-800 shadow-glow" 
                : "bg-white/20 text-white border-white/30 hover:bg-white/30"
            }`}
          >
            {t(f.toLowerCase().replace(' ', ''))}
          </Button>
        ))}
      </div>

      {/* Orders grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-elegant hover:shadow-glow transition-all duration-300 animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-orange-800">
                        {t('table')} {order.table_number} - {order.customer_name || "Guest"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.created_at?.toDate ? order.created_at.toDate().toLocaleTimeString() : ""}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} font-medium`}>
                      {t(order.status)}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex flex-col p-3 bg-orange-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium text-orange-800">{item.name} x{item.quantity}</span>
                          <span className="text-sm text-gray-600">
                            ${(item.price_per_item * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.note && (
                          <div className="mt-2 pl-3 border-l-2 border-orange-300 text-sm italic text-gray-700">
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                      <p className="text-sm text-amber-700 font-medium">Order Note:</p>
                      <p className="text-sm text-amber-800">{order.note}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <span className="font-bold text-white">{t('total')}:</span>
                    <span className="text-xl font-bold text-white">${order.total_amount.toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => updateOrderStatus(order.id, "accepted")}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> {t('accept')}
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-2" /> {t('reject')}
                        </Button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                      >
                        <Clock className="w-4 h-4 mr-2" /> {t('startPreparing')}
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => updateOrderStatus(order.id, "ready")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> {t('markReady')}
                      </Button>
                    )}

                    {order.status === "ready" && (
                      <div className="w-full text-center p-3 bg-green-100 rounded-lg border-2 border-green-500">
                        <span className="text-green-700 font-bold">{t('orderReady')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('noActiveOrders')}</h3>
            <p className="text-orange-200 text-lg">{t('waitingCustomers')}</p>
          </div>
        )}
      </div>
    </div>
  );
};