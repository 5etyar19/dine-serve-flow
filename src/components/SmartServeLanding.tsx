import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerInterface } from "./customer/CustomerInterface";
import { KitchenInterface } from "./interfaces/KitchenInterface";
import { QrCode, Users, ChefHat, CreditCard, BarChart3, Smartphone, Clock, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-restaurant.jpg";

type InterfaceType = "landing" | "customer" | "kitchen" | "cashier" | "admin";

export const SmartServeLanding = () => {
  const [currentInterface, setCurrentInterface] = useState<InterfaceType>("landing");

  if (currentInterface === "customer") {
    return <CustomerInterface />;
  }

  if (currentInterface === "kitchen") {
    return <KitchenInterface />;
  }

  const features = [
    {
      icon: <QrCode className="w-8 h-8 text-primary" />,
      title: "QR Code Ordering",
      description: "Customers scan QR codes on tables to access the digital menu and place orders instantly"
    },
    {
      icon: <ChefHat className="w-8 h-8 text-primary" />,
      title: "Kitchen Management", 
      description: "Real-time order notifications with accept/reject functionality and preparation tracking"
    },
    {
      icon: <CreditCard className="w-8 h-8 text-primary" />,
      title: "Cashier Interface",
      description: "Streamlined payment processing, invoice generation, and order status management"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: "Admin Dashboard",
      description: "Comprehensive management of menu, tables, staff, and detailed financial reporting"
    }
  ];

  const benefits = [
    {
      icon: <Smartphone className="w-6 h-6 text-success" />,
      title: "Contactless Experience",
      description: "Reduce physical contact with digital menus and mobile ordering"
    },
    {
      icon: <Clock className="w-6 h-6 text-success" />,
      title: "Faster Service",
      description: "Eliminate wait times for menu browsing and order taking"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-success" />,
      title: "Order Accuracy",
      description: "Direct customer input reduces miscommunication errors"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
              Next-Generation Restaurant Technology
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                SmartServe
              </span>
              <br />
              <span className="text-foreground">
                Restaurant System
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform your restaurant with QR code ordering, real-time kitchen management, 
              cashier integration, and comprehensive admin controls. Streamline operations 
              and enhance customer experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => setCurrentInterface("customer")}
                className="text-lg px-8"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Try Customer Interface
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setCurrentInterface("kitchen")}
                className="text-lg px-8"
              >
                <ChefHat className="w-5 h-5 mr-2" />
                View Kitchen Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Restaurant Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four integrated interfaces designed to streamline every aspect of your restaurant operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-smooth animate-fade-in group">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-smooth">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Interfaces */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience the Interfaces
            </h2>
            <p className="text-xl text-muted-foreground">
              Try out each interface to see how SmartServe works
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentInterface("customer")}
              className="h-auto p-6 flex-col gap-3 hover:shadow-elegant"
            >
              <Users className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">Customer Interface</div>
                <div className="text-sm text-muted-foreground">Browse menu & order</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentInterface("kitchen")}
              className="h-auto p-6 flex-col gap-3 hover:shadow-elegant"
            >
              <ChefHat className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold">Kitchen Dashboard</div>
                <div className="text-sm text-muted-foreground">Manage orders</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="h-auto p-6 flex-col gap-3 hover:shadow-elegant opacity-75 cursor-not-allowed"
              disabled
            >
              <CreditCard className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="font-semibold">Cashier Interface</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="h-auto p-6 flex-col gap-3 hover:shadow-elegant opacity-75 cursor-not-allowed"
              disabled
            >
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
              <div>
                <div className="font-semibold">Admin Dashboard</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Why Choose SmartServe?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center animate-fade-in">
                  <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join the future of restaurant operations with SmartServe. 
            Contact us to get started with your implementation.
          </p>
          
          <p className="text-primary-foreground/80 mb-6">
            <strong>Note:</strong> Full functionality requires backend integration with Supabase for real-time updates, 
            user authentication, and data persistence.
          </p>
          
          <Button variant="secondary" size="lg" className="text-lg px-8">
            Contact Sales
          </Button>
        </div>
      </section>
    </div>
  );
};