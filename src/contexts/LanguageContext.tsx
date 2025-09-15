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
      tables: "Tables",
      
      // Landing Page
      nextGenRestaurantTech: "Next-Generation Restaurant Technology",
      smartServeSystem: "SmartServe Restaurant System",
      transformRestaurant: "Transform your restaurant with QR code ordering, real-time kitchen management, cashier integration, and comprehensive admin controls. Streamline operations and enhance customer experience.",
      tryCustomerInterface: "Try Customer Interface",
      viewKitchenDashboard: "View Kitchen Dashboard",
      completeRestaurantManagement: "Complete Restaurant Management",
      fourIntegratedInterfaces: "Four integrated interfaces designed to streamline every aspect of your restaurant operations",
      qrCodeOrdering: "QR Code Ordering",
      qrDescription: "Customers scan QR codes on tables to access the digital menu and place orders instantly",
      kitchenManagement: "Kitchen Management",
      kitchenDescription: "Real-time order notifications with accept/reject functionality and preparation tracking",
      cashierInterface: "Cashier Interface",
      cashierDescription: "Streamlined payment processing, invoice generation, and order status management",
      adminDescription: "Comprehensive management of menu, tables, staff, and detailed financial reporting",
      experienceInterfaces: "Experience the Interfaces",
      tryEachInterface: "Try out each interface to see how SmartServe works",
      customerInterface: "Customer Interface",
      browseMenuOrder: "Browse menu & order",
      manageOrders: "Manage orders",
      paymentBilling: "Payment & billing",
      analyticsManagement: "Analytics & management",
      whyChooseSmartServe: "Why Choose SmartServe?",
      contactlessExperience: "Contactless Experience",
      contactlessDescription: "Reduce physical contact with digital menus and mobile ordering",
      fasterService: "Faster Service",
      fasterDescription: "Eliminate wait times for menu browsing and order taking",
      orderAccuracy: "Order Accuracy",
      accuracyDescription: "Direct customer input reduces miscommunication errors",
      readyToTransform: "Ready to Transform Your Restaurant?",
      joinFuture: "Join the future of restaurant operations with SmartServe. Contact us to get started with your implementation.",
      contactSales: "Contact Sales",
      noteFullFunctionality: "Note: Full functionality requires backend integration with Supabase for real-time updates, user authentication, and data persistence.",
      
      // Cashier
      cashierDashboard: "Cashier Dashboard",
      orderProcessing: "Order Processing",
      processPayments: "Process Payments",
      generateInvoices: "Generate Invoices",
      orderHistory: "Order History",
      orderDetails: "Order Details",
      paymentMethod: "Payment Method",
      cash: "Cash",
      card: "Card",
      paymentProcessed: "Payment Processed",
      
      // Live Preview Buttons
      livePreview: "Live Preview",
      kitchenPreview: "Kitchen Preview",
      cashierPreview: "Cashier Preview"
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
      tables: "الطاولات",
      
      // Landing Page
      nextGenRestaurantTech: "تقنية المطاعم الجيل القادم",
      smartServeSystem: "نظام سمارت سيرف للمطاعم",
      transformRestaurant: "حول مطعمك مع طلب رمز الاستجابة السريعة، إدارة المطبخ في الوقت الفعلي، تكامل الصندوق، وضوابط الإدارة الشاملة. تبسيط العمليات وتحسين تجربة العملاء.",
      tryCustomerInterface: "جرب واجهة العميل",
      viewKitchenDashboard: "عرض لوحة المطبخ",
      completeRestaurantManagement: "إدارة مطعم كاملة",
      fourIntegratedInterfaces: "أربع واجهات متكاملة مصممة لتبسيط كل جانب من جوانب عمليات مطعمك",
      qrCodeOrdering: "طلب رمز الاستجابة السريعة",
      qrDescription: "يمسح العملاء رموز الاستجابة السريعة على الطاولات للوصول إلى القائمة الرقمية وتقديم الطلبات فورًا",
      kitchenManagement: "إدارة المطبخ",
      kitchenDescription: "إشعارات الطلبات في الوقت الفعلي مع وظيفة القبول/الرفض وتتبع التحضير",
      cashierInterface: "واجهة الصندوق",
      cashierDescription: "معالجة الدفع المبسطة، وتوليد الفواتير، وإدارة حالة الطلب",
      adminDescription: "إدارة شاملة للقائمة والطاولات والموظفين وتقرير مالي مفصل",
      experienceInterfaces: "تجربة الواجهات",
      tryEachInterface: "جرب كل واجهة لترى كيف يعمل SmartServe",
      customerInterface: "واجهة العميل",
      browseMenuOrder: "تصفح القائمة والطلب",
      manageOrders: "إدارة الطلبات",
      paymentBilling: "الدفع والفوترة",
      analyticsManagement: "التحليلات والإدارة",
      whyChooseSmartServe: "لماذا تختار SmartServe؟",
      contactlessExperience: "تجربة بدون تلامس",
      contactlessDescription: "تقليل الاتصال الجسدي مع القوائم الرقمية والطلب المحمول",
      fasterService: "خدمة أسرع",
      fasterDescription: "إلغاء أوقات الانتظار لتصفح القائمة وأخذ الطلب",
      orderAccuracy: "دقة الطلب",
      accuracyDescription: "إدخال العميل المباشر يقلل من أخطاء سوء الفهم",
      readyToTransform: "هل أنت مستعد لتحويل مطعمك؟",
      joinFuture: "انضم إلى مستقبل عمليات المطاعم مع SmartServe. اتصل بنا للبدء في التنفيذ الخاص بك.",
      contactSales: "اتصل بالمبيعات",
      noteFullFunctionality: "ملاحظة: الوظائف الكاملة تتطلب تكامل خلفي مع Supabase للتحديثات في الوقت الفعلي، وتوثيق المستخدم، واستمرارية البيانات.",
      
      // Cashier
      cashierDashboard: "لوحة الصندوق",
      orderProcessing: "معالجة الطلبات",
      processPayments: "معالجة المدفوعات",
      generateInvoices: "إنشاء الفواتير",
      orderHistory: "تاريخ الطلبات",
      orderDetails: "تفاصيل الطلب",
      paymentMethod: "طريقة الدفع",
      cash: "نقد",
      card: "بطاقة",
      paymentProcessed: "تم معالجة الدفع",
      
      // Live Preview Buttons
      livePreview: "معاينة مباشرة",
      kitchenPreview: "معاينة المطبخ",
      cashierPreview: "معاينة الصندوق"
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
  const isRTL = false; // Disabled RTL as requested

  const handleSetLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    // Don't change document direction
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