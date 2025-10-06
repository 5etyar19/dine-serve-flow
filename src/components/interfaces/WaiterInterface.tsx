import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users } from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

type TableStatus = "available" | "occupied" | "reserved";

interface Table {
  id: string;
  table_number: number;
  status?: TableStatus;
}

type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";

interface Order {
  id: string;
  table_number: number;
  status: OrderStatus;
}

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

export const WaiterInterface = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

  const handleTableClick = (tableNumber: number) => {
    navigate(`/waiter/table/${tableNumber}`);
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
                <p className="text-muted-foreground text-sm">Select a table to take orders</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                      className="cursor-pointer transition-smooth hover:shadow-elegant hover:scale-105"
                      onClick={() => handleTableClick(table.table_number)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold mb-3">
                          {table.table_number}
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
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
