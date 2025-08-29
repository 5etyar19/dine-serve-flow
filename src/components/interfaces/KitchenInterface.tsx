// // src/components/kitchen/KitchenInterface.tsx
// import { useEffect, useState } from "react";
// import { collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { CheckCircle, X, Clock, ChefHat, ArrowLeft } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// interface OrderItem {
//   item_id: string;
//   name: string;
//   quantity: number;
//   price_per_item: number;
//   note?: string;
// }

// interface Order {
//   id: string;
//   table_number: number;
//   customer_name: string | null;
//   total_amount: number;
//   status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
//   created_at: any;
//   updated_at?: any;
//   items: OrderItem[];
//   note?: string;
// }

// interface KitchenInterfaceProps {
//   onBack: () => void;
// }

// export const KitchenInterface = ({ onBack }: KitchenInterfaceProps) => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<"All" | "Pending" | "In Progress" | "Ready">("All");
//   const { toast } = useToast();

//   useEffect(() => {
//     setLoading(true);
//     const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
//     const unsub = onSnapshot(
//       q,
//       (snapshot) => {
//         const ordersData: Order[] = snapshot.docs.map((d) => ({
//           id: d.id,
//           ...(d.data() as any),
//         }));
//         setOrders(ordersData);
//         setLoading(false);
//       },
//       (err) => {
//         console.error("Failed to fetch orders:", err);
//         toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
//         setLoading(false);
//       }
//     );
//     return () => unsub();
//   }, []); // eslint-disable-line

//   const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
//     try {
//       const orderRef = doc(db, "orders", orderId);
//       await updateDoc(orderRef, { status: newStatus, updated_at: Timestamp.now() });
//       toast({ title: "Order Updated", description: `Order status changed to ${newStatus}` });
//     } catch (err) {
//       console.error("Error updating order:", err);
//       toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
//     }
//   };

//   const getStatusColor = (status: Order["status"]) => {
//     switch (status) {
//       case "pending": return "bg-warning text-warning-foreground";
//       case "accepted": return "bg-primary text-primary-foreground";
//       case "preparing": return "bg-secondary text-secondary-foreground";
//       case "ready": return "bg-success text-success-foreground";
//       case "completed": return "bg-success text-success-foreground";
//       case "cancelled": return "bg-destructive text-destructive-foreground";
//       default: return "bg-muted text-muted-foreground";
//     }
//   };

//   const filteredOrders = orders.filter((o) => {
//     if (filter === "All") return true;
//     if (filter === "Pending") return o.status === "pending";
//     if (filter === "In Progress") return o.status === "accepted" || o.status === "preparing";
//     if (filter === "Ready") return o.status === "ready";
//     return true;
//   });

//   // Counters
//   const pendingCount = orders.filter((o) => o.status === "pending").length;
//   const inProgressCount = orders.filter((o) => o.status === "accepted" || o.status === "preparing").length;
//   const readyCount = orders.filter((o) => o.status === "ready").length;
//   const rejectedCount = orders.filter((o) => o.status === "cancelled").length;

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Loading kitchen orders...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-subtle">
//       {/* Header */}
//       <header className="bg-card border-b shadow-soft sticky top-0 z-10">
//         <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//           <Button variant="outline" onClick={onBack}>
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Kitchen Dashboard</h1>
//             <p className="text-muted-foreground text-sm">Order Management System</p>
//           </div>
//           <div className="text-right">
//             <p className="text-sm text-muted-foreground">Active Orders</p>
//             <p className="text-2xl font-bold text-primary">{orders.length}</p>
//           </div>
//         </div>
//       </header>

//       {/* Status counters with left color bars */}
//       <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
//         <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
//           <span className="w-2 h-12 mr-3 bg-yellow-500 rounded"></span>
//           <div className="text-center flex-1">
//             <p className="text-sm text-muted-foreground">Pending</p>
//             <p className="text-xl font-bold">{pendingCount}</p>
//           </div>
//         </div>

//         <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
//           <span className="w-2 h-12 mr-3 bg-orange-500 rounded"></span>
//           <div className="text-center flex-1">
//             <p className="text-sm text-muted-foreground">In Progress</p>
//             <p className="text-xl font-bold">{inProgressCount}</p>
//           </div>
//         </div>

//         <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
//           <span className="w-2 h-12 mr-3 bg-green-500 rounded"></span>
//           <div className="text-center flex-1">
//             <p className="text-sm text-muted-foreground">Ready</p>
//             <p className="text-xl font-bold">{readyCount}</p>
//           </div>
//         </div>

//         <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
//           <span className="w-2 h-12 mr-3 bg-red-500 rounded"></span>
//           <div className="text-center flex-1">
//             <p className="text-sm text-muted-foreground">Rejected</p>
//             <p className="text-xl font-bold">{rejectedCount}</p>
//           </div>
//         </div>
//       </div>

//       {/* Filter buttons */}
//       <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
//         {(["All", "Pending", "In Progress", "Ready"] as const).map((f) => (
//           <Button
//             key={f}
//             variant={filter === f ? "default" : "outline"}
//             onClick={() => setFilter(f)}
//             className="whitespace-nowrap"
//           >
//             {f}
//           </Button>
//         ))}
//       </div>

//       {/* Orders grid */}
//       <div className="container mx-auto px-4 py-6">
//         {filteredOrders.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {filteredOrders.map((order) => (
//               <Card key={order.id} className="hover:shadow-elegant transition-smooth animate-fade-in">
//                 <CardContent className="p-6">
//                   <div className="flex justify-between items-start mb-4">
//                     <div>
//                       <h3 className="text-lg font-semibold">
//                         Table {order.table_number} - {order.customer_name || "Guest"}
//                       </h3>
//                       <p className="text-sm text-muted-foreground">
//                         {order.created_at?.toDate ? order.created_at.toDate().toLocaleTimeString() : (order.created_at instanceof Date ? order.created_at.toLocaleTimeString() : "")}
//                       </p>
//                     </div>
//                     <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
//                   </div>

//                   {/* Items + per-item notes */}
//                   <div className="space-y-3 mb-4">
//                     {(order.items || []).map((item, idx) => (
//                       <div key={idx} className="flex flex-col">
//                         <div className="flex justify-between">
//                           <span className="text-sm">
//                             {item.name} x{item.quantity}
//                           </span>
//                           <span className="text-sm text-muted-foreground">
//                             ${(item.price_per_item * item.quantity).toFixed(2)}
//                           </span>
//                         </div>
//                         {item.note && (
//                           <div className="mt-1 pl-3 border-l text-xs italic text-muted-foreground">
//                             Note: {item.note}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>

//                   {/* Optional order-level note if present */}
//                   {order.note && (
//                     <div className="mb-4 p-3 bg-muted rounded-lg">
//                       <p className="text-sm text-muted-foreground">Order Note:</p>
//                       <p className="text-sm font-medium">{order.note}</p>
//                     </div>
//                   )}

//                   <Separator className="my-4" />

//                   <div className="flex justify-between items-center mb-4">
//                     <span className="font-semibold">Total:</span>
//                     <span className="font-bold text-primary">${order.total_amount.toFixed(2)}</span>
//                   </div>

//                   <div className="flex gap-2">
//                     {order.status === "pending" && (
//                       <>
//                         <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "accepted")}>
//                           <CheckCircle className="w-4 h-4 mr-2" /> Accept Order
//                         </Button>
//                         <Button
//                           variant="destructive"
//                           className="flex-1"
//                           onClick={() => updateOrderStatus(order.id, "cancelled")}
//                         >
//                           <X className="w-4 h-4 mr-2" /> Reject
//                         </Button>
//                       </>
//                     )}

//                     {order.status === "accepted" && (
//                       <Button className="w-full" onClick={() => updateOrderStatus(order.id, "preparing")}>
//                         <Clock className="w-4 h-4 mr-2" /> Start Preparing
//                       </Button>
//                     )}

//                     {order.status === "preparing" && (
//                       <Button variant="success" className="w-full" onClick={() => updateOrderStatus(order.id, "ready")}>
//                         <CheckCircle className="w-4 h-4 mr-2" /> Mark as Ready
//                       </Button>
//                     )}

//                     {order.status === "ready" && (
//                       <div className="w-full text-center p-2 bg-success/10 rounded-lg">
//                         <span className="text-success font-medium">Order Ready for Pickup</span>

//                         <Button
//                           size="sm"
//                           variant="destructive"
//                           onClick={async () => {
//                             try {
//                               await deleteDoc(doc(db, "orders", order.id));
//                               toast({ title: "Order Deleted", description: "The order has been removed." });
//                             } catch (err) {
//                               console.error("Failed to delete order:", err);
//                               toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
//                             }
//                           }}
//                           className="ml-2 w-6 h-6 p-0 flex items-center justify-center"
//                         >
//                           <X className="w-3 h-3" />
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
//             <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
//             <p className="text-muted-foreground">Waiting for customers...</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };



// src/components/kitchen/KitchenInterface.tsx
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, X, Clock, ChefHat, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch orders:", err);
        toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []); // eslint-disable-line

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus, updated_at: Timestamp.now() });
      toast({ title: "Order Updated", description: `Order status changed to ${newStatus}` });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">Kitchen Dashboard</h1>
            <p className="text-muted-foreground text-sm">Order Management System</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Orders</p>
            <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
          </div>
        </div>
      </header>

      {/* Status counters */}
      <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
          <span className="w-2 h-12 mr-3 bg-yellow-500 rounded"></span>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-bold">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
          <span className="w-2 h-12 mr-3 bg-orange-500 rounded"></span>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-xl font-bold">{inProgressCount}</p>
          </div>
        </div>

        <div className="p-4 bg-card rounded-lg shadow-sm flex items-center">
          <span className="w-2 h-12 mr-3 bg-green-500 rounded"></span>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">Ready</p>
            <p className="text-xl font-bold">{readyCount}</p>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
        {(["All", "Pending", "In Progress", "Ready"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Orders grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-elegant transition-smooth animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Table {order.table_number} - {order.customer_name || "Guest"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.created_at?.toDate ? order.created_at.toDate().toLocaleTimeString() : ""}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm">{item.name} x{item.quantity}</span>
                          <span className="text-sm text-muted-foreground">
                            ${(item.price_per_item * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.note && (
                          <div className="mt-1 pl-3 border-l text-xs italic text-muted-foreground">
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Order Note:</p>
                      <p className="text-sm font-medium">{order.note}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">${order.total_amount.toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button className="flex-1" onClick={() => updateOrderStatus(order.id, "accepted")}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <Button className="w-full" onClick={() => updateOrderStatus(order.id, "preparing")}>
                        <Clock className="w-4 h-4 mr-2" /> Start Preparing
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button variant="success" className="w-full" onClick={() => updateOrderStatus(order.id, "ready")}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Ready
                      </Button>
                    )}

                    {order.status === "ready" && (
                      <div className="w-full text-center p-2 bg-success/10 rounded-lg">
                        <span className="text-success font-medium">Order Ready</span>
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
            <p className="text-muted-foreground">Waiting for customers...</p>
          </div>
        )}
      </div>
    </div>
  );
};


