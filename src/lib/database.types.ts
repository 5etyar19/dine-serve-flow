export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tables: {
        Row: {
          id: string
          table_number: number
          status: 'available' | 'occupied' | 'reserved'
          qr_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: number
          status?: 'available' | 'occupied' | 'reserved'
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: number
          status?: 'available' | 'occupied' | 'reserved'
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: string
          image_url: string | null
          is_vegetarian: boolean
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: string
          image_url?: string | null
          is_vegetarian?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: string
          image_url?: string | null
          is_vegetarian?: boolean
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: string
          customer_name: string | null
          status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          customer_name?: string | null
          status?: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          customer_name?: string | null
          status?: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_per_item: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_per_item: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price_per_item?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}