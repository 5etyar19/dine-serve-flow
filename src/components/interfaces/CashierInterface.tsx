// // src/components/interfaces/CashierInterface.tsx
// import { useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ArrowLeft, CreditCard, Receipt, Users, DollarSign, Clock } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   collection,
//   doc,
//   getDocs,
//   onSnapshot,
//   query,
//   updateDoc,
//   where,
//   Timestamp,
// } from "firebase/firestore";
// import { db, nowTs } from "@/lib/firebase";

// type TableStatus = "available" | "occupied" | "reserved";

// interface Table {
//   id: string;
//   table_number: number;
//   status?: TableStatus;
// }

// type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";

// interface OrderItem {
//   item_id?: string;
//   name: string;
//   quantity: number;
//   price_per_item: number;
//   note?: string | null;
// }

// interface Order {
//   id: string;
//   table_number: number;
//   customer_name: string | null;
//   status: OrderStatus;
//   total_amount: number;
//   created_at: Timestamp | string;
//   items: OrderItem[];
// }

// const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

// function toDate(val: Timestamp | string): Date {
//   if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as any).toDate === "function") {
//     return (val as Timestamp).toDate();
//   }
//   return new Date(val as string);
// }


// export const CashierInterface = ({ onBack }: { onBack: () => void }) => {
//   const { toast } = useToast();
//   const [tables, setTables] = useState<Table[]>([]);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setLoading(true);

//     const unsubTables = onSnapshot(collection(db, "tables"), (snap) => {
//       const rows: Table[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
//       setTables(rows);
//     });

//     const qOrders = query(
//       collection(db, "orders"),
//       where("status", "in", ACTIVE_STATUSES)
//     );
//     const unsubOrders = onSnapshot(
//       qOrders,
//       (snap) => {
//         const rows: Order[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
//         setOrders(rows);
//         setLoading(false);
//       },
//       (err) => {
//         console.error(err);
//         toast({ title: "Error", description: "Failed to subscribe to orders", variant: "destructive" });
//         setLoading(false);
//       }
//     );

//     return () => {
//       unsubTables();
//       unsubOrders();
//     };
//   }, [toast]);

//   const getTableOrdersByNumber = (tableNumber: number) =>
//     orders.filter((order) => order.table_number === tableNumber);

//   const getTableTotalByNumber = (tableNumber: number) =>
//     getTableOrdersByNumber(tableNumber).reduce((sum, order) => sum + (order.total_amount || 0), 0);

//   const selectedTableNumber = useMemo(() => {
//     if (!selectedTableId) return undefined;
//     return tables.find((t) => t.id === selectedTableId)?.table_number;
//   }, [selectedTableId, tables]);

//   const selectedOrders = useMemo(() => {
//     if (selectedTableNumber == null) return [];
//     return getTableOrdersByNumber(selectedTableNumber);
//   }, [selectedTableNumber, orders]);

//   const selectedTableTotal = useMemo(() => {
//     if (selectedTableNumber == null) return 0;
//     return getTableTotalByNumber(selectedTableNumber);
//   }, [selectedTableNumber, orders]);

//   async function processPaymentForTable() {
//     if (!selectedTableNumber) return;
//     try {
//       // Mark all orders as completed
//       const ordersToComplete = selectedOrders.filter((o) => o.status === "ready");
//       for (const order of ordersToComplete) {
//         await updateDoc(doc(db, "orders", order.id), {
//           status: "completed",
//           paid_at: nowTs(),
//         });
//       }

//       // Free the table if no active orders remain
//       const qActiveSameTable = query(
//         collection(db, "orders"),
//         where("table_number", "==", selectedTableNumber),
//         where("status", "in", ACTIVE_STATUSES)
//       );
//       const stillActive = await getDocs(qActiveSameTable);

//       if (stillActive.empty) {
//         const tableDoc = tables.find((t) => t.table_number === selectedTableNumber);
//         if (tableDoc) {
//           await updateDoc(doc(db, "tables", tableDoc.id), { status: "available" });
//         }
//       }

//       toast({ title: "Payment processed", description: `Table #${selectedTableNumber} completed` });
//     } catch (e) {
//       console.error(e);
//       toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
//     }
//   }

//   function printReceiptForTable() {
//     if (!selectedTableNumber) return;
//     const allItems: OrderItem[] = [];
//     let earliestTime: Date | null = null;

//     selectedOrders.forEach((order) => {
//       allItems.push(...order.items);
//       const orderTime = toDate(order.created_at);
//       if (!earliestTime || orderTime < earliestTime) earliestTime = orderTime;
//     });

//     const dt = earliestTime || new Date();

//     const lines = allItems.map(
//       (it) =>
//         `<tr>
//           <td style="text-align:left;">${escapeHtml(it.name)} x${it.quantity}</td>
//           <td style="text-align:right;">$${(it.price_per_item * it.quantity).toFixed(2)}</td>
//         </tr>`
//     ).join("");

//     const total = selectedTableTotal.toFixed(2);

//     const html = `
// <!doctype html>
// <html>
//   <head>
//     <meta charset="utf-8" />
//     <title>Receipt - Table ${selectedTableNumber}</title>
//     <style>
//       * { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
//       body { margin: 0; padding: 16px; }
//       .center { text-align:center; }
//       .muted { color: #666; font-size: 12px; }
//       table { width: 100%; border-collapse: collapse; margin-top: 8px; }
//       td { padding: 4px 0; }
//       .totals { margin-top: 8px; border-top: 1px dashed #999; padding-top: 8px; }
//       .bold { font-weight: 700; }
//     </style>
//   </head>
//   <body>
//     <div class="center">
//       <div class="bold">SmartServe</div>
//       <div class="muted">${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}</div>
//       <div class="muted">Table #${selectedTableNumber}</div>
//     </div>

//     <table>
//       <tbody>
//         ${lines}
//       </tbody>
//     </table>

//     <div class="totals">
//       <table>
//         <tr>
//           <td class="bold">Total</td>
//           <td style="text-align:right;" class="bold">$${total}</td>
//         </tr>
//       </table>
//     </div>

//     <div class="center" style="margin-top:12px;">Thank you!</div>
//     <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); }</script>
//   </body>
// </html>`.trim();

//     const w = window.open("", "_blank", "width=380,height=640");
//     if (!w) return;
//     w.document.open();
//     w.document.write(html);
//     w.document.close();
//     w.focus();
//   }

//   function escapeHtml(s: string) {
//     return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!));
//   }

//   const getOrderStatusColor = (status: OrderStatus) => {
//     switch (status) {
//       case "pending": return "bg-warning text-warning-foreground";
//       case "accepted": return "bg-primary text-primary-foreground";
//       case "preparing": return "bg-secondary text-secondary-foreground";
//       case "ready": return "bg-success text-success-foreground";
//       default: return "bg-muted text-muted-foreground";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Loading cashier interface...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-subtle">
//       {/* Header */}
//       <header className="bg-card border-b shadow-soft sticky top-0 z-10">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Button variant="outline" onClick={onBack}>
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back
//               </Button>
//               <div>
//                 <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
//                   Cashier Interface
//                 </h1>
//                 <p className="text-muted-foreground text-sm">Payment & Table Management</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="text-right">
//                 <p className="text-sm text-muted-foreground">Active Orders</p>
//                 <p className="text-2xl font-bold text-primary">{orders.length}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-6">
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Tables Overview */}
//           <div className="lg:col-span-2">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Users className="w-5 h-5" />
//                   Tables Overview
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
//                   {tables
//                   .slice() // create a shallow copy so original state isn’t mutated
//                   .sort((a, b) => a.table_number - b.table_number)
//                   .map((table) => {
//                     const tableOrders = getTableOrdersByNumber(table.table_number);
//                     const tableTotal = getTableTotalByNumber(table.table_number);
//                     const hasOrders = tableOrders.length > 0;
//                     return (
//                       <Card
//                         key={table.id}
//                         className={`cursor-pointer transition-smooth hover:shadow-elegant ${
//                           selectedTableId === table.id ? "ring-2 ring-primary" : ""
//                         }`}
//                         onClick={() => setSelectedTableId(table.id)}
//                       >
//                         <CardContent className="p-4 text-center">
//                           <div className="text-lg font-bold mb-2">Table {table.table_number}</div>
//                           <Badge
//                             className={`mb-2 ${
//                               hasOrders
//                                 ? "bg-destructive text-destructive-foreground"
//                                 : "bg-success text-success-foreground"
//                             }`}
//                           >
//                             {hasOrders ? "In Progress" : (table.status ?? "Available")}
//                           </Badge>
//                           {hasOrders && (
//                             <div className="text-sm">
//                               <p className="font-medium">${tableTotal.toFixed(2)}</p>
//                               <p className="text-muted-foreground">{tableOrders.length} order(s)</p>
//                             </div>
//                           )}
//                         </CardContent>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Order Details */}
//           <div>
//             <Card className="sticky top-24">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Receipt className="w-5 h-5" />
//                   {selectedTableNumber != null
//                     ? `Table ${selectedTableNumber} Details`
//                     : "Select a Table"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {selectedTableNumber != null && selectedOrders.length > 0 ? (
//                   <div className="space-y-4">
//                     {selectedOrders.map((order) => (
//                       <Card key={order.id} className="border-l-4 border-l-primary">
//                         <CardContent className="p-4">
//                           <div className="flex justify-between items-start mb-3">
//                             <div>
//                               <p className="font-semibold">{order.customer_name || "Guest"}</p>
//                               <p className="text-sm text-muted-foreground">
//                                 {toDate(order.created_at).toLocaleTimeString()}
//                               </p>
//                             </div>
//                             <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
//                           </div>

//                           <div className="space-y-2 mb-4">
//                             {order.items.map((item, idx) => (
//                               <div key={idx} className="flex justify-between text-sm">
//                                 <span>{item.name} x{item.quantity}</span>
//                                 <span>${(item.price_per_item * item.quantity).toFixed(2)}</span>
//                               </div>
//                             ))}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))}

//                     <div className="mt-6 p-4 bg-primary/10 rounded-lg">
//                       <div className="flex justify-between items-center mb-4">
//                         <span className="text-lg font-bold">Table Total:</span>
//                         <span className="text-xl font-bold text-primary">
//                           ${selectedTableTotal.toFixed(2)}
//                         </span>
//                       </div>

//                       {/* Buttons for table receipt & payment */}
//                       <div className="grid grid-cols-2 gap-2">
//                         <Button variant="outline" onClick={printReceiptForTable}>
//                           <Receipt className="w-4 h-4 mr-2" />
//                           Print Receipt
//                         </Button>
//                         <Button onClick={processPaymentForTable}>
//                           <CreditCard className="w-4 h-4 mr-2" />
//                           Process Payment
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 ) : selectedTableNumber != null && selectedOrders.length === 0 ? (
//                   <div className="text-center py-8">
//                     <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
//                     <p className="text-muted-foreground">No active orders for this table</p>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
//                     <p className="text-muted-foreground">Select a table to view order details</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
// {/* Create Order Button */}
// <div className="my-4 text-right">
//   <Button
//     variant="hero"
//     disabled={!selectedTableId}
//     onClick={() => {
//       if (!selectedTableId) return;
//       const tableNumber = tables.find(t => t.id === selectedTableId)?.table_number;
//       if (!tableNumber) return;
//       // Navigate to CustomerInterface with table number
//       window.location.href = `/t/${tableNumber}`;
//     }}
//   >
//     Create New Order
//   </Button>
// </div>
            
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };



// src/components/interfaces/CashierInterface.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Receipt, Users, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
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

function toDate(val: Timestamp | string): Date {
  if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as any).toDate === "function") {
    return (val as Timestamp).toDate();
  }
  return new Date(val as string);
}

export const CashierInterface = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- realtime subscriptions ----
  useEffect(() => {
    setLoading(true);

    const unsubTables = onSnapshot(collection(db, "tables"), (snap) => {
      const rows: Table[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setTables(rows);
    });

    // Listen to active orders only
    const qOrders = query(
      collection(db, "orders"),
      where("status", "in", ACTIVE_STATUSES)
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const rows: Order[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setOrders(rows);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast({ title: "Error", description: "Failed to subscribe to orders", variant: "destructive" });
      setLoading(false);
    });

    return () => {
      unsubTables();
      unsubOrders();
    };
  }, [toast]);

  // Helpers
  const getTableOrdersByNumber = (tableNumber: number) =>
    orders.filter((order) => order.table_number === tableNumber);

  const getTableTotalByNumber = (tableNumber: number) =>
    getTableOrdersByNumber(tableNumber).reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const selectedTableNumber = useMemo(() => {
    if (!selectedTableId) return undefined;
    return tables.find((t) => t.id === selectedTableId)?.table_number;
  }, [selectedTableId, tables]);

  const selectedOrders = useMemo(() => {
    if (selectedTableNumber == null) return [];
    return getTableOrdersByNumber(selectedTableNumber);
  }, [selectedTableNumber, orders]);

  const selectedTableTotal = useMemo(() => {
    if (selectedTableNumber == null) return 0;
    return getTableTotalByNumber(selectedTableNumber);
  }, [selectedTableNumber, orders]);

  // ---- payment processing ----
  async function processPaymentForTable() {
    if (!selectedTableNumber) return;
    try {
      // Mark all 'ready' orders as completed
      const ordersToComplete = selectedOrders.filter((o) => o.status === "ready");
      for (const order of ordersToComplete) {
        await updateDoc(doc(db, "orders", order.id), {
          status: "completed",
          paid_at: nowTs(),
        });
      }

      // Free the table if no active orders remain
      const qActiveSameTable = query(
        collection(db, "orders"),
        where("table_number", "==", selectedTableNumber),
        where("status", "in", ACTIVE_STATUSES)
      );
      const stillActive = await getDocs(qActiveSameTable);

      if (stillActive.empty) {
        const tableDoc = tables.find((t) => t.table_number === selectedTableNumber);
        if (tableDoc) {
          await updateDoc(doc(db, "tables", tableDoc.id), { status: "available" });
        }
      }

      toast({ title: "Payment processed", description: `Table #${selectedTableNumber} completed` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
    }
  }

  // ---- print receipt (merged per table) ----
  function printReceiptForTable() {
    if (!selectedTableNumber) return;
    const allItems: OrderItem[] = [];
    let earliestTime: Date | null = null;

    selectedOrders.forEach((order) => {
      allItems.push(...(order.items || []));
      const orderTime = toDate(order.created_at);
      if (!earliestTime || orderTime < earliestTime) earliestTime = orderTime;
    });

    const dt = earliestTime || new Date();

    const lines = allItems.map(
      (it) =>
        `<tr>
          <td style="text-align:left;">${escapeHtml(it.name)} x${it.quantity}</td>
          <td style="text-align:right;">$${(it.price_per_item * it.quantity).toFixed(2)}</td>
        </tr>`
    ).join("");

    const total = selectedTableTotal.toFixed(2);

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt - Table ${selectedTableNumber}</title>
    <style>
      * { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      body { margin: 0; padding: 16px; }
      .center { text-align:center; }
      .muted { color: #666; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      td { padding: 4px 0; }
      .totals { margin-top: 8px; border-top: 1px dashed #999; padding-top: 8px; }
      .bold { font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="center">
      <div class="bold">SmartServe</div>
      <div class="muted">${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}</div>
      <div class="muted">Table #${selectedTableNumber}</div>
    </div>

    <table>
      <tbody>
        ${lines}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td class="bold">Total</td>
          <td style="text-align:right;" class="bold">$${total}</td>
        </tr>
      </table>
    </div>

    <div class="center" style="margin-top:12px;">Thank you!</div>
    <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); }</script>
  </body>
</html>`.trim();

    const w = window.open("", "_blank", "width=380,height=640");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!));
  }

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "accepted": return "bg-primary text-primary-foreground";
      case "preparing": return "bg-secondary text-secondary-foreground";
      case "ready": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
                  {tables
                  .slice()
                  .sort((a, b) => a.table_number - b.table_number)
                  .map((table) => {
                    const tableOrders = getTableOrdersByNumber(table.table_number);
                    const tableTotal = getTableTotalByNumber(table.table_number);
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
                          <div className="text-lg font-bold mb-2">Table {table.table_number}</div>
                          <Badge
                            className={`mb-2 ${
                              hasOrders
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-success text-success-foreground"
                            }`}
                          >
                            {hasOrders ? "In Progress" : (table.status ?? "Available")}
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
                  {selectedTableNumber != null
                    ? `Table ${selectedTableNumber} Details`
                    : "Select a Table"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTableNumber != null && selectedOrders.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold">{order.customer_name || "Guest"}</p>
                              <p className="text-sm text-muted-foreground">
                                {toDate(order.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                          </div>

                          <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${(item.price_per_item * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Table Total:</span>
                        <span className="text-xl font-bold text-primary">
                          ${selectedTableTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Buttons for table receipt & payment */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={printReceiptForTable}>
                          <Receipt className="w-4 h-4 mr-2" />
                          Print Receipt
                        </Button>
                        <Button onClick={processPaymentForTable}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Process Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : selectedTableNumber != null && selectedOrders.length === 0 ? (
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

            {/* Create Order Button */}
            <div className="my-4 text-right">
              <Button
                variant="hero"
                disabled={!selectedTableId}
                onClick={() => {
                  if (!selectedTableId) return;
                  const tableNumber = tables.find(t => t.id === selectedTableId)?.table_number;
                  if (!tableNumber && tableNumber !== 0) return;
                  // Navigate to CustomerInterface with table number
                  window.location.href = `/t/${tableNumber}`;
                }}
              >
                Create New Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


