import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle, XCircle, Users } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  timestamp: Date;
  status: "pending" | "accepted" | "rejected" | "completed";
  estimatedTime?: number;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    tableNumber: 12,
    items: [
      { id: "1", name: "Signature Gourmet Burger", quantity: 2 },
      { id: "2", name: "Fresh Caesar Salad", quantity: 1 }
    ],
    totalAmount: 52.97,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: "pending"
  },
  {
    id: "ORD-002", 
    tableNumber: 8,
    items: [
      { id: "3", name: "Chocolate Decadence", quantity: 2 },
      { id: "1", name: "Signature Gourmet Burger", quantity: 1 }
    ],
    totalAmount: 44.97,
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    status: "accepted",
    estimatedTime: 15
  }
];

export const KitchenInterface = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const handleOrderAction = (orderId: string, action: "accept" | "reject" | "complete") => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          let newStatus: Order["status"];
          let estimatedTime = order.estimatedTime;
          
          switch (action) {
            case "accept":
              newStatus = "accepted";
              estimatedTime = 20; // Default 20 minutes
              break;
            case "reject":
              newStatus = "rejected";
              break;
            case "complete":
              newStatus = "completed";
              break;
            default:
              newStatus = order.status;
          }
          
          return { ...order, status: newStatus, estimatedTime };
        }
        return order;
      })
    );
  };

  const getTimeElapsed = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    return `${diff}m ago`;
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "accepted": return "bg-primary text-primary-foreground";
      case "rejected": return "bg-destructive text-destructive-foreground";
      case "completed": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const pendingOrders = orders.filter(order => order.status === "pending");
  const activeOrders = orders.filter(order => order.status === "accepted");
  const completedOrders = orders.filter(order => order.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Kitchen Dashboard
              </h1>
              <p className="text-muted-foreground">Manage incoming orders</p>
            </div>
            
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{pendingOrders.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activeOrders.length}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Orders ({pendingOrders.length})
            </h2>
            
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="border-warning/50 shadow-elegant">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Table {order.tableNumber}
                        </CardTitle>
                        <CardDescription>
                          Order #{order.id} • {getTimeElapsed(order.timestamp)}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          {item.notes && (
                            <span className="text-sm text-muted-foreground italic">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total: ${order.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="success" 
                        onClick={() => handleOrderAction(order.id, "accept")}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Order
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleOrderAction(order.id, "reject")}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Active Orders ({activeOrders.length})
            </h2>
            
            <div className="grid gap-4">
              {activeOrders.map((order) => (
                <Card key={order.id} className="border-primary/50 shadow-elegant">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Table {order.tableNumber}
                        </CardTitle>
                        <CardDescription>
                          Order #{order.id} • Est. {order.estimatedTime}min
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        IN PROGRESS
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="success" 
                      onClick={() => handleOrderAction(order.id, "complete")}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {pendingOrders.length === 0 && activeOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">No active orders</h3>
            <p className="text-muted-foreground">New orders will appear here when customers place them.</p>
          </div>
        )}
      </div>
    </div>
  );
};