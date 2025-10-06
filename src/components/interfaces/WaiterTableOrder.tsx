import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Minus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMenu } from "@/contexts/MenuContext";
import { useParams, useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db, nowTs } from "@/lib/firebase";

interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price_per_item: number;
}

export const WaiterTableOrder = () => {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { menuItems, categories } = useMenu();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : [];

  const handleItemIncrement = (itemId: string) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(itemId) || 0;
    newMap.set(itemId, current + 1);
    setSelectedItems(newMap);
  };

  const handleItemDecrement = (itemId: string) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(itemId) || 0;
    if (current > 1) {
      newMap.set(itemId, current - 1);
    } else {
      newMap.delete(itemId);
    }
    setSelectedItems(newMap);
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please add items to the order",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderItems: OrderItem[] = [];
      let total = 0;

      selectedItems.forEach((quantity, itemId) => {
        const item = menuItems.find((m) => m.id === itemId);
        if (item) {
          orderItems.push({
            item_id: item.id,
            name: item.name,
            quantity,
            price_per_item: item.price,
          });
          total += item.price * quantity;
        }
      });

      await addDoc(collection(db, "orders"), {
        table_number: parseInt(tableNumber || "0"),
        customer_name: null,
        status: "pending",
        total_amount: total,
        created_at: nowTs(),
        items: orderItems,
      });

      toast({
        title: "Order Submitted",
        description: `Order for Table ${tableNumber} sent to kitchen`,
      });

      setSelectedItems(new Map());
      navigate("/waiter");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const totalItems = Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/waiter")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Table {tableNumber}
                </h1>
                <p className="text-muted-foreground text-sm">Create Order</p>
              </div>
            </div>
            {totalItems > 0 && (
              <Button onClick={handleSubmitOrder} size="lg" className="gap-2">
                <Send className="w-4 h-4" />
                Submit Order ({totalItems} items)
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Categories */}
        {!selectedCategory ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer transition-smooth hover:shadow-elegant hover:scale-105"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedCategory}</h2>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
            </div>

            <div className="grid gap-3">
              {filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No items in this category</p>
                  </CardContent>
                </Card>
              ) : (
                filteredItems.map((item) => {
                  const quantity = selectedItems.get(item.id) || 0;
                  return (
                    <Card
                      key={item.id}
                      className={`transition-smooth ${
                        quantity > 0 ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {quantity > 0 ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleItemDecrement(item.id)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="font-bold text-xl w-12 text-center">
                                  {quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleItemIncrement(item.id)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                size="icon"
                                onClick={() => handleItemIncrement(item.id)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Order Summary - Fixed at bottom on mobile */}
        {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-elegant p-4 md:hidden">
            <Button onClick={handleSubmitOrder} size="lg" className="w-full gap-2">
              <Send className="w-4 h-4" />
              Submit Order ({totalItems} items)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
