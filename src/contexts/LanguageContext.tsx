import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Navigation
    'nav.back': 'Back',
    'nav.home': 'Home',
    
    // Landing Page
    'landing.title': 'SmartServe',
    'landing.subtitle': 'Restaurant System',
    'landing.description': 'Transform your restaurant with QR code ordering, real-time kitchen management, cashier integration, and comprehensive admin controls. Streamline operations and enhance customer experience.',
    'landing.tryCustomer': 'Try Customer Interface',
    'landing.viewKitchen': 'View Kitchen Dashboard',
    'landing.features.title': 'Complete Restaurant Management',
    'landing.features.subtitle': 'Four integrated interfaces designed to streamline every aspect of your restaurant operations',
    'landing.experience.title': 'Experience the Interfaces',
    'landing.experience.subtitle': 'Try out each interface to see how SmartServe works',
    
    // Customer Interface
    'customer.title': 'SmartServe',
    'customer.table': 'Table',
    'customer.viewCart': 'View Cart',
    'customer.yourCart': 'Your Cart',
    'customer.reviewOrder': 'Review your order',
    'customer.customerInfo': 'Customer Information',
    'customer.enterName': 'Enter your name (optional)',
    'customer.orderSummary': 'Order Summary',
    'customer.addNote': 'Add a note (optional)',
    'customer.total': 'Total',
    'customer.placeOrder': 'Place Order',
    'customer.backToMenu': 'Back to Menu',
    'customer.addToOrder': 'Add to Order',
    'customer.yourOrder': 'Your Order',
    'customer.reviewAndPlace': 'Review & Place Order',
    
    // Kitchen Interface
    'kitchen.title': 'Kitchen Dashboard',
    'kitchen.subtitle': 'Order Management System',
    'kitchen.activeOrders': 'Active Orders',
    'kitchen.pending': 'Pending',
    'kitchen.inProgress': 'In Progress',
    'kitchen.ready': 'Ready',
    'kitchen.all': 'All',
    'kitchen.accept': 'Accept',
    'kitchen.reject': 'Reject',
    'kitchen.startPreparing': 'Start Preparing',
    'kitchen.markReady': 'Mark Ready',
    'kitchen.orderReady': 'Order Ready',
    'kitchen.manageMenu': 'Manage Menu',
    'kitchen.available': 'Available',
    'kitchen.unavailable': 'Unavailable',
    'kitchen.searchMenu': 'Search menu items...',
    'kitchen.noOrders': 'No Active Orders',
    'kitchen.waitingCustomers': 'Waiting for customers...',
    
    // Cashier Interface
    'cashier.title': 'Cashier Interface',
    'cashier.subtitle': 'Payment & Table Management',
    'cashier.tablesOverview': 'Tables Overview',
    'cashier.tableDetails': 'Table Details',
    'cashier.selectTable': 'Select a Table',
    'cashier.printReceipt': 'Print Receipt',
    'cashier.processPayment': 'Process Payment',
    'cashier.createNewOrder': 'Create New Order',
    'cashier.noActiveOrders': 'No active orders for this table',
    'cashier.selectTableView': 'Select a table to view order details',
    'cashier.inProgress': 'In Progress',
    'cashier.available': 'Available',
    'cashier.cancelOrder': 'Cancel Order',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Restaurant Management & Analytics',
    'admin.sessionStart': 'Session start',
    'admin.endDay': 'End Day',
    'admin.activeOrders': 'Active Orders',
    'admin.totalOrders': 'Total Orders',
    'admin.totalSales': 'Total Sales',
    'admin.totalTax': 'Total Tax (16%)',
    'admin.salesAfterTax': 'Sales After Tax',
    'admin.completed': 'Completed',
    'admin.recentOrders': 'Most Recent Orders',
    'admin.analytics': 'Analytics',
    'admin.orderStatus': 'Order Status',
    'admin.items': 'Items',
    'admin.categories': 'Categories',
    'admin.tables': 'Tables',
    'admin.pastDays': 'Past Days',
    'admin.addNewItem': 'Add New Item',
    'admin.editItem': 'Edit Item',
    'admin.addNewCategory': 'Add New Category',
    'admin.editCategory': 'Edit Category',
    'admin.addNewTable': 'Add New Table',
    'admin.editTable': 'Edit Table',
    'admin.name': 'Name',
    'admin.nameArabic': 'Name (Arabic)',
    'admin.description': 'Description',
    'admin.descriptionArabic': 'Description (Arabic)',
    'admin.price': 'Price',
    'admin.category': 'Category',
    'admin.image': 'Image',
    'admin.uploadImage': 'Upload Image',
    'admin.changeImage': 'Change Image',
    'admin.createItem': 'Create Item',
    'admin.updateItem': 'Update Item',
    'admin.createCategory': 'Create Category',
    'admin.updateCategory': 'Update Category',
    'admin.createTable': 'Create Table',
    'admin.updateTable': 'Update Table',
    'admin.cancel': 'Cancel',
    'admin.tableNumber': 'Table Number',
    'admin.searchItems': 'Search items...',
    'admin.searchCategories': 'Search categories...',
    'admin.searchTable': 'Search table...',
    'admin.printExport': 'Print / Export',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.guest': 'Guest',
    'common.orders': 'Orders',
    'common.order': 'Order',
    'common.note': 'Note',
    'common.status': 'Status',
    'common.table': 'Table',
    'common.time': 'Time',
    'common.amount': 'Amount',
    'common.quantity': 'Quantity',
  },
  ar: {
    // Navigation
    'nav.back': 'رجوع',
    'nav.home': 'الرئيسية',
    
    // Landing Page
    'landing.title': 'سمارت سيرف',
    'landing.subtitle': 'نظام المطعم',
    'landing.description': 'حوّل مطعمك بنظام الطلب عبر رمز الاستجابة السريعة، وإدارة المطبخ في الوقت الفعلي، وتكامل الكاشير، والتحكم الشامل للإدارة. بسّط العمليات وحسّن تجربة العملاء.',
    'landing.tryCustomer': 'جرب واجهة العميل',
    'landing.viewKitchen': 'عرض لوحة المطبخ',
    'landing.features.title': 'إدارة مطعم شاملة',
    'landing.features.subtitle': 'أربع واجهات متكاملة مصممة لتبسيط جميع جوانب عمليات مطعمك',
    'landing.experience.title': 'جرب الواجهات',
    'landing.experience.subtitle': 'جرب كل واجهة لترى كيف يعمل سمارت سيرف',
    
    // Customer Interface
    'customer.title': 'سمارت سيرف',
    'customer.table': 'طاولة',
    'customer.viewCart': 'عرض السلة',
    'customer.yourCart': 'سلتك',
    'customer.reviewOrder': 'راجع طلبك',
    'customer.customerInfo': 'معلومات العميل',
    'customer.enterName': 'أدخل اسمك (اختياري)',
    'customer.orderSummary': 'ملخص الطلب',
    'customer.addNote': 'أضف ملاحظة (اختياري)',
    'customer.total': 'المجموع',
    'customer.placeOrder': 'تأكيد الطلب',
    'customer.backToMenu': 'العودة للقائمة',
    'customer.addToOrder': 'أضف للطلب',
    'customer.yourOrder': 'طلبك',
    'customer.reviewAndPlace': 'راجع وأكد الطلب',
    
    // Kitchen Interface
    'kitchen.title': 'لوحة المطبخ',
    'kitchen.subtitle': 'نظام إدارة الطلبات',
    'kitchen.activeOrders': 'الطلبات النشطة',
    'kitchen.pending': 'في الانتظار',
    'kitchen.inProgress': 'قيد التحضير',
    'kitchen.ready': 'جاهز',
    'kitchen.all': 'الكل',
    'kitchen.accept': 'قبول',
    'kitchen.reject': 'رفض',
    'kitchen.startPreparing': 'بدء التحضير',
    'kitchen.markReady': 'تحديد كجاهز',
    'kitchen.orderReady': 'الطلب جاهز',
    'kitchen.manageMenu': 'إدارة القائمة',
    'kitchen.available': 'متوفر',
    'kitchen.unavailable': 'غير متوفر',
    'kitchen.searchMenu': 'البحث في عناصر القائمة...',
    'kitchen.noOrders': 'لا توجد طلبات نشطة',
    'kitchen.waitingCustomers': 'في انتظار العملاء...',
    
    // Cashier Interface
    'cashier.title': 'واجهة الكاشير',
    'cashier.subtitle': 'الدفع وإدارة الطاولات',
    'cashier.tablesOverview': 'نظرة عامة على الطاولات',
    'cashier.tableDetails': 'تفاصيل الطاولة',
    'cashier.selectTable': 'اختر طاولة',
    'cashier.printReceipt': 'طباعة الفاتورة',
    'cashier.processPayment': 'معالجة الدفع',
    'cashier.createNewOrder': 'إنشاء طلب جديد',
    'cashier.noActiveOrders': 'لا توجد طلبات نشطة لهذه الطاولة',
    'cashier.selectTableView': 'اختر طاولة لعرض تفاصيل الطلب',
    'cashier.inProgress': 'قيد التنفيذ',
    'cashier.available': 'متاح',
    'cashier.cancelOrder': 'إلغاء الطلب',
    
    // Admin Dashboard
    'admin.title': 'لوحة الإدارة',
    'admin.subtitle': 'إدارة المطعم والتحليلات',
    'admin.sessionStart': 'بداية الجلسة',
    'admin.endDay': 'إنهاء اليوم',
    'admin.activeOrders': 'الطلبات النشطة',
    'admin.totalOrders': 'إجمالي الطلبات',
    'admin.totalSales': 'إجمالي المبيعات',
    'admin.totalTax': 'إجمالي الضريبة (16%)',
    'admin.salesAfterTax': 'المبيعات بعد الضريبة',
    'admin.completed': 'مكتمل',
    'admin.recentOrders': 'أحدث الطلبات',
    'admin.analytics': 'التحليلات',
    'admin.orderStatus': 'حالة الطلب',
    'admin.items': 'العناصر',
    'admin.categories': 'الفئات',
    'admin.tables': 'الطاولات',
    'admin.pastDays': 'الأيام السابقة',
    'admin.addNewItem': 'إضافة عنصر جديد',
    'admin.editItem': 'تعديل العنصر',
    'admin.addNewCategory': 'إضافة فئة جديدة',
    'admin.editCategory': 'تعديل الفئة',
    'admin.addNewTable': 'إضافة طاولة جديدة',
    'admin.editTable': 'تعديل الطاولة',
    'admin.name': 'الاسم',
    'admin.nameArabic': 'الاسم (بالعربية)',
    'admin.description': 'الوصف',
    'admin.descriptionArabic': 'الوصف (بالعربية)',
    'admin.price': 'السعر',
    'admin.category': 'الفئة',
    'admin.image': 'الصورة',
    'admin.uploadImage': 'رفع صورة',
    'admin.changeImage': 'تغيير الصورة',
    'admin.createItem': 'إنشاء عنصر',
    'admin.updateItem': 'تحديث العنصر',
    'admin.createCategory': 'إنشاء فئة',
    'admin.updateCategory': 'تحديث الفئة',
    'admin.createTable': 'إنشاء طاولة',
    'admin.updateTable': 'تحديث الطاولة',
    'admin.cancel': 'إلغاء',
    'admin.tableNumber': 'رقم الطاولة',
    'admin.searchItems': 'البحث في العناصر...',
    'admin.searchCategories': 'البحث في الفئات...',
    'admin.searchTable': 'البحث في الطاولة...',
    'admin.printExport': 'طباعة / تصدير',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.guest': 'ضيف',
    'common.orders': 'الطلبات',
    'common.order': 'طلب',
    'common.note': 'ملاحظة',
    'common.status': 'الحالة',
    'common.table': 'طاولة',
    'common.time': 'الوقت',
    'common.amount': 'المبلغ',
    'common.quantity': 'الكمية',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};