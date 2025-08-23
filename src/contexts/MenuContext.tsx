import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_vegetarian?: boolean;
  is_available?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface MenuContextType {
  menuItems: MenuItem[];
  categories: Category[];
  setMenuItems: (items: MenuItem[]) => void;
  setCategories: (categories: Category[]) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Main Course', description: 'Hearty main dishes' },
    { id: '2', name: 'Salads', description: 'Fresh and healthy salads' },
    { id: '3', name: 'Desserts', description: 'Sweet treats and desserts' },
    { id: '4', name: 'Beverages', description: 'Drinks and beverages' }
  ]);

  return (
    <MenuContext.Provider value={{ menuItems, categories, setMenuItems, setCategories }}>
      {children}
    </MenuContext.Provider>
  );
};