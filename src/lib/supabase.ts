import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Helper functions for common operations
export const insertMenuItems = async () => {
  const menuItems = [
    {
      name: "Signature Gourmet Burger",
      description: "Juicy beef patty with aged cheddar, caramelized onions, crispy bacon, and our special sauce on a brioche bun",
      price: 18.99,
      category: "Main Course",
      image_url: "/assets/food-burger.jpg",
      is_vegetarian: false,
      is_available: true
    },
    {
      name: "Fresh Caesar Salad",
      description: "Crisp romaine lettuce with grilled chicken, parmesan cheese, croutons, and house-made Caesar dressing",
      price: 14.99,
      category: "Salads",
      image_url: "/assets/food-salad.jpg",
      is_vegetarian: false,
      is_available: true
    },
    {
      name: "Chocolate Decadence",
      description: "Rich dark chocolate mousse with fresh berries, whipped cream, and a delicate chocolate tuile",
      price: 12.99,
      category: "Desserts",
      image_url: "/assets/food-dessert.jpg",
      is_vegetarian: true,
      is_available: true
    }
  ];

  const { data, error } = await supabase.from('menu_items').upsert(menuItems, {
    onConflict: 'name'
  });
  
  if (error) console.error('Error inserting menu items:', error);
  return { data, error };
};

export const insertTables = async () => {
  const tables = Array.from({ length: 20 }, (_, i) => ({
    table_number: i + 1,
    status: 'available' as const,
    qr_code: `table-${i + 1}`
  }));

  const { data, error } = await supabase.from('tables').upsert(tables, {
    onConflict: 'table_number'
  });
  
  if (error) console.error('Error inserting tables:', error);
  return { data, error };
};