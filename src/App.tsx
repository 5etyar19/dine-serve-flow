import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MenuProvider } from "@/contexts/MenuContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// NEW: import the screens
import { CashierInterface } from "@/components/interfaces/CashierInterface";
import { WaiterInterface } from "@/components/interfaces/WaiterInterface";
import { WaiterTableOrder } from "@/components/interfaces/WaiterTableOrder";
import { CustomerInterface } from "@/components/customer/CustomerInterface";
import { AdminDashboard } from "@/components/interfaces/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <MenuProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            <Route
              path="/cashier"
              element={<CashierInterface onBack={() => window.history.back()} />}
            />
            <Route
              path="/waiter"
              element={<WaiterInterface onBack={() => window.history.back()} />}
            />
            <Route
              path="/waiter/table/:tableNumber"
              element={<WaiterTableOrder />}
            />
            {/* NEW: admin dashboard */}
            <Route
              path="/admin"
              element={<AdminDashboard onBack={() => window.history.back()} />}
            />

            {/* NEW: deep link per table, e.g. /t/12 */}
            <Route
              path="/t/:tableNumber"
              element={<CustomerInterface onBack={() => window.history.back()} />}
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </MenuProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
