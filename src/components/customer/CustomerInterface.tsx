import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { MenuCard } from "./MenuCard";
import { ShoppingCart, Utensils, Coffee, Cake, ArrowLeft, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import burgerImage from "@/assets/food-burger.jpg";
import saladImage from "@/assets/food-salad.jpg";
import dessertImage from "@/assets/food-dessert.jpg";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  is_vegetarian: boolean;
  is_available: boolean;
}

interface CustomerInterfaceProps {
  onBack: () => void;
}

const MOCK_MENU: MenuItem[] = [
  {
    id: "1",
    name: "Signature Gourmet Burger",
    description:
      "Juicy beef patty with aged cheddar, caramelized onions, crispy bacon, and our special sauce on a brioche bun",
    price: 18.99,
    image_url: burgerImage,
    category: "Main Course",
    is_vegetarian: false,
    is_available: true,
  },
  {
    id: "2",
    name: "Fresh Caesar Salad",
    description:
      "Crisp romaine lettuce with grilled chicken, parmesan cheese, croutons, and house-made Caesar dressing",
    price: 14.99,
    image_url: saladImage,
    category: "Salads",
    is_vegetarian: false,
    is_available: true,
  },
  {
    id: "3",
    name: "Chocolate Decadence",
    description:
      "Rich dark chocolate mousse with fresh berries, whipped cream, and a delicate chocolate tuile",
    price: 12.99,
    image_url: dessertImage,
    category: "Desserts",
    is_vegetarian: true,
    is_available: true,
  },
];

export const CustomerInterface = ({ onBack }: CustomerInterfaceProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();

  const categories = ["All", "Main Course", "Salads", "Desserts", "Beverages"];

  useEffect(() => {
    setMenuItems(MOCK_MENU);
    setLoading(false);
  }, []);

  const handleQuantityChange = (id: string, quantity: number) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);

      if (quantity === 0) {
        return prev.filter((c) => c.id !== id);
      }
      if (existing) {
        return prev.map((c) => (c.id === id ? { ...c, quantity } : c));
      }
      return [...prev, { id, name: item.name, price: item.price, quantity }];
    });
  };

  const getCartQuantity = (id: string) => cart.find((i) => i.id === id)?.quantity || 0;
  const getTotalPrice = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const getTotalItems = () => cart.reduce((t, i) => t + i.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      toast({
        title: "Demo Order Placed!",
        description: `Your order for $${getTotalPrice().toFixed(2)} has been simulated.`,
      });
      setCart([]);
      setCustomerName("");
      setShowCart(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to place order.", variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  const filteredMenu = activeCategory === "All"
    ? menuItems
    : menuItems.filter((i) => i.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (showCart) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="bg-card border-b shadow-soft sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setShowCart(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Menu
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    Your Cart
                  </h1>
                  <p className="text-muted-foreground text-sm">Review your order</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter your name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={placeOrder}
                  disabled={placing}
                >
                  {placing ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
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
                  SmartServe
                </h1>
                <p className="text-muted-foreground text-sm">Table #12</p>
              </div>
            </div>

            {getTotalItems() > 0 && (
              <Button variant="hero" className="relative" onClick={() => setShowCart(true)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
                <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className="whitespace-nowrap"
            >
              {category === "Main Course" && <Utensils className="w-4 h-4 mr-2" />}
              {category === "Beverages" && <Coffee className="w-4 h-4 mr-2" />}
              {category === "Desserts" && <Cake className="w-4 h-4 mr-2" />}
              {category}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredMenu.map((item) => (
            <MenuCard
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image_url || burgerImage}
              category={item.category}
              isVegetarian={item.is_vegetarian}
              quantity={getCartQuantity(item.id)}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>

        {/* Cart Summary (sticky bar) */}
        {cart.length > 0 && (
          <Card className="sticky bottom-4 shadow-elegant bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-sm">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold text-primary">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>

              <Button variant="hero" className="w-full" size="lg" onClick={() => setShowCart(true)}>
                Review & Place Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
