import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MenuCard } from "./MenuCard";
import { ShoppingCart, Utensils, Coffee, Cake } from "lucide-react";
import burgerImage from "@/assets/food-burger.jpg";
import saladImage from "@/assets/food-salad.jpg";
import dessertImage from "@/assets/food-dessert.jpg";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const MOCK_MENU = [
  {
    id: "1",
    name: "Signature Gourmet Burger",
    description: "Juicy beef patty with aged cheddar, caramelized onions, crispy bacon, and our special sauce on a brioche bun",
    price: 18.99,
    image: burgerImage,
    category: "Main Course",
    isVegetarian: false
  },
  {
    id: "2", 
    name: "Fresh Caesar Salad",
    description: "Crisp romaine lettuce with grilled chicken, parmesan cheese, croutons, and house-made Caesar dressing",
    price: 14.99,
    image: saladImage,
    category: "Salads",
    isVegetarian: false
  },
  {
    id: "3",
    name: "Chocolate Decadence",
    description: "Rich dark chocolate mousse with fresh berries, whipped cream, and a delicate chocolate tuile",
    price: 12.99,
    image: dessertImage,
    category: "Desserts",
    isVegetarian: true
  }
];

export const CustomerInterface = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Main Course", "Salads", "Desserts", "Beverages"];

  const handleQuantityChange = (id: string, quantity: number) => {
    const item = MOCK_MENU.find(item => item.id === id);
    if (!item) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === id);
      
      if (quantity === 0) {
        return prevCart.filter(cartItem => cartItem.id !== id);
      }
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === id ? { ...cartItem, quantity } : cartItem
        );
      }
      
      return [...prevCart, { id, name: item.name, price: item.price, quantity }];
    });
  };

  const getCartQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredMenu = activeCategory === "All" 
    ? MOCK_MENU 
    : MOCK_MENU.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                SmartServe
              </h1>
              <p className="text-muted-foreground text-sm">Table #12</p>
            </div>
            
            {getTotalItems() > 0 && (
              <Button variant="hero" className="relative">
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
              {...item}
              quantity={getCartQuantity(item.id)}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>

        {/* Cart Summary */}
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
              
              <Button variant="hero" className="w-full" size="lg">
                Place Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};