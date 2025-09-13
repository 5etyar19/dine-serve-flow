import React, { createContext, useContext, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      back: "Back",
      menu: "Menu",
      cart: "Cart",
      viewCart: "View Cart",
      
      // Customer Interface
      smartServe: "SmartServe",
      table: "Table",
      addToOrder: "Add to Order",
      yourCart: "Your Cart",
      reviewOrder: "Review your order",
      customerInfo: "Customer Information",
      enterName: "Enter your name (optional)",
      orderSummary: "Order Summary",
      addNote: "Add a note (optional)",
      total: "Total",
      placeOrder: "Place Order",
      placingOrder: "Placing Order...",
      reviewPlaceOrder: "Review & Place Order",
      
      // Categories
      all: "All",
      mainCourse: "Main Course", 
      beverages: "Beverages",
      desserts: "Desserts",
      
      // Kitchen
      kitchenDashboard: "Kitchen Dashboard",
      orderManagement: "Order Management System",
      activeOrders: "Active Orders",
      pending: "Pending",
      inProgress: "In Progress",
      ready: "Ready",
      accept: "Accept",
      reject: "Reject",
      startPreparing: "Start Preparing",
      markReady: "Mark Ready",
      orderReady: "Order Ready",
      noActiveOrders: "No Active Orders",
      waitingCustomers: "Waiting for customers...",
      
      // Admin
      adminDashboard: "Admin Dashboard",
      analytics: "Analytics",
      items: "Items",
      categories: "Categories",
      tables: "Tables"
    }
  },
  ar: {
    translation: {
      // Navigation
      back: "رجوع",
      menu: "القائمة",
      cart: "السلة",
      viewCart: "عرض السلة",
      
      // Customer Interface
      smartServe: "سمارت سيرف",
      table: "طاولة",
      addToOrder: "إضافة للطلب",
      yourCart: "سلتك",
      reviewOrder: "راجع طلبك",
      customerInfo: "معلومات العميل",
      enterName: "أدخل اسمك (اختياري)",
      orderSummary: "ملخص الطلب",
      addNote: "إضافة ملاحظة (اختياري)",
      total: "المجموع",
      placeOrder: "تأكيد الطلب",
      placingOrder: "جاري تأكيد الطلب...",
      reviewPlaceOrder: "راجع وأكد الطلب",
      
      // Categories
      all: "الكل",
      mainCourse: "الأطباق الرئيسية",
      beverages: "المشروبات", 
      desserts: "الحلويات",
      
      // Kitchen
      kitchenDashboard: "لوحة المطبخ",
      orderManagement: "نظام إدارة الطلبات",
      activeOrders: "الطلبات النشطة",
      pending: "في الانتظار",
      inProgress: "قيد التحضير",
      ready: "جاهز",
      accept: "قبول",
      reject: "رفض",
      startPreparing: "بدء التحضير",
      markReady: "تعليم كجاهز",
      orderReady: "الطلب جاهز",
      noActiveOrders: "لا توجد طلبات نشطة",
      waitingCustomers: "في انتظار العملاء...",
      
      // Admin
      adminDashboard: "لوحة الإدارة",
      analytics: "التحليلات",
      items: "العناصر",
      categories: "الفئات",
      tables: "الطاولات"
    }
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const isRTL = language === 'ar';

  const handleSetLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string) => i18n.t(key);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      t, 
      isRTL 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}