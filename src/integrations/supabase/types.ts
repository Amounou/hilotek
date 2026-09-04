export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content_en: string | null
          content_fr: string | null
          cover_url: string | null
          created_at: string
          excerpt_en: string | null
          excerpt_fr: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title_en: string
          title_fr: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_en?: string | null
          content_fr?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title_en: string
          title_fr: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_en?: string | null
          content_fr?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_en?: string | null
          excerpt_fr?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title_en?: string
          title_fr?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_fr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_number: string
          items: Json
          memoire_id: string | null
          notes: string | null
          order_id: string | null
          qr_data: string | null
          repair_id: string | null
          subtotal: number
          tax: number
          total: number
          type: Database["public"]["Enums"]["invoice_type"]
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number: string
          items?: Json
          memoire_id?: string | null
          notes?: string | null
          order_id?: string | null
          qr_data?: string | null
          repair_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["invoice_type"]
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          memoire_id?: string | null
          notes?: string | null
          order_id?: string | null
          qr_data?: string | null
          repair_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["invoice_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_memoire_id_fkey"
            columns: ["memoire_id"]
            isOneToOne: false
            referencedRelation: "memoires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      memoire_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          memoire_id: string
          note: string | null
          status: Database["public"]["Enums"]["memoire_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          memoire_id: string
          note?: string | null
          status: Database["public"]["Enums"]["memoire_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          memoire_id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["memoire_status"]
        }
        Relationships: [
          {
            foreignKeyName: "memoire_status_history_memoire_id_fkey"
            columns: ["memoire_id"]
            isOneToOne: false
            referencedRelation: "memoires"
            referencedColumns: ["id"]
          },
        ]
      }
      memoires: {
        Row: {
          balance: number
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          deadline: string | null
          deposit: number
          document_url: string | null
          filiere: string | null
          id: string
          level: string | null
          memoire_number: string
          notes: string | null
          progress: number
          status: Database["public"]["Enums"]["memoire_status"]
          theme: string
          total_amount: number
          tracking_token: string
          university: string | null
          updated_at: string
          writer_id: string | null
        }
        Insert: {
          balance?: number
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          deadline?: string | null
          deposit?: number
          document_url?: string | null
          filiere?: string | null
          id?: string
          level?: string | null
          memoire_number: string
          notes?: string | null
          progress?: number
          status?: Database["public"]["Enums"]["memoire_status"]
          theme: string
          total_amount?: number
          tracking_token: string
          university?: string | null
          updated_at?: string
          writer_id?: string | null
        }
        Update: {
          balance?: number
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          deadline?: string | null
          deposit?: number
          document_url?: string | null
          filiere?: string | null
          id?: string
          level?: string | null
          memoire_number?: string
          notes?: string | null
          progress?: number
          status?: Database["public"]["Enums"]["memoire_status"]
          theme?: string
          total_amount?: number
          tracking_token?: string
          university?: string | null
          updated_at?: string
          writer_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping: number
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping?: number
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          cost_price: number | null
          low_stock_threshold: number
          product_id: string
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          low_stock_threshold?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          low_stock_threshold?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          description_en: string | null
          description_fr: string | null
          features: Json
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          name_en: string
          name_fr: string
          price: number
          promo_price: number | null
          sku: string
          slug: string
          stock: number
          updated_at: string
          warranty_months: number
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          features?: Json
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name_en: string
          name_fr: string
          price?: number
          promo_price?: number | null
          sku: string
          slug: string
          stock?: number
          updated_at?: string
          warranty_months?: number
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          features?: Json
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name_en?: string
          name_fr?: string
          price?: number
          promo_price?: number | null
          sku?: string
          slug?: string
          stock?: number
          updated_at?: string
          warranty_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proforma_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          product_id: string | null
          product_name: string
          proforma_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          product_id?: string | null
          product_name: string
          proforma_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          product_id?: string | null
          product_name?: string
          proforma_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proforma_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proforma_items_proforma_id_fkey"
            columns: ["proforma_id"]
            isOneToOne: false
            referencedRelation: "proformas"
            referencedColumns: ["id"]
          },
        ]
      }
      proformas: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          proforma_date: string
          proforma_number: string | null
          seller_name: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          proforma_date?: string
          proforma_number?: string | null
          seller_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          proforma_date?: string
          proforma_number?: string | null
          seller_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proformas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          description: string
          email: string
          id: string
          name: string
          phone: string | null
          request_number: string
          service_type: string
          status: string
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          phone?: string | null
          request_number: string
          service_type: string
          status?: string
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          request_number?: string
          service_type?: string
          status?: string
        }
        Relationships: []
      }
      repair_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          repair_id: string
          status: Database["public"]["Enums"]["repair_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          repair_id: string
          status: Database["public"]["Enums"]["repair_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          repair_id?: string
          status?: Database["public"]["Enums"]["repair_status"]
        }
        Relationships: [
          {
            foreignKeyName: "repair_status_history_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          accessories: string | null
          brand: string | null
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          created_by: string | null
          deposit: number
          device_type: string
          diagnosis: string | null
          id: string
          imei: string | null
          issue_description: string
          model: string | null
          notes: string | null
          photos: string[]
          price_quote: number | null
          repair_number: string
          serial_number: string | null
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string | null
          total: number | null
          tracking_token: string
          updated_at: string
        }
        Insert: {
          accessories?: string | null
          brand?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          created_by?: string | null
          deposit?: number
          device_type: string
          diagnosis?: string | null
          id?: string
          imei?: string | null
          issue_description: string
          model?: string | null
          notes?: string | null
          photos?: string[]
          price_quote?: number | null
          repair_number: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          total?: number | null
          tracking_token: string
          updated_at?: string
        }
        Update: {
          accessories?: string | null
          brand?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          created_by?: string | null
          deposit?: number
          device_type?: string
          diagnosis?: string | null
          id?: string
          imei?: string | null
          issue_description?: string
          model?: string | null
          notes?: string | null
          photos?: string[]
          price_quote?: number | null
          repair_number?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          total?: number | null
          tracking_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          sale_date: string
          seller_name: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          sale_date?: string
          seller_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          sale_date?: string
          seller_name?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          booking_number: string
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          id: string
          notes: string | null
          preferred_date: string | null
          service_id: string | null
          service_name: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          booking_number: string
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          booking_number?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description_en: string | null
          description_fr: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_fr: string
          price_from: number | null
          slug: string
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en: string
          name_fr: string
          price_from?: number | null
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_fr?: string
          price_from?: number | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          company_name: string
          currency: string
          email: string | null
          hours: string | null
          id: number
          logo_url: string | null
          phone: string | null
          socials: Json
          tax_rate: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string
          currency?: string
          email?: string | null
          hours?: string | null
          id?: number
          logo_url?: string | null
          phone?: string | null
          socials?: Json
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          currency?: string
          email?: string | null
          hours?: string | null
          id?: number
          logo_url?: string | null
          phone?: string | null
          socials?: Json
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_profile: { Args: never; Returns: undefined }
      get_public_settings: { Args: never; Returns: Json }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_order: { Args: { _payload: Json }; Returns: Json }
      track_memoire: { Args: { _token: string }; Returns: Json }
      track_repair: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "technician"
        | "cashier"
        | "commercial"
        | "warehouse"
        | "writer"
        | "support"
        | "customer"
      invoice_type: "invoice" | "receipt" | "quote" | "delivery_note"
      memoire_status:
        | "received"
        | "assigned"
        | "in_progress"
        | "review"
        | "completed"
        | "delivered"
        | "cancelled"
      movement_type: "in" | "out" | "adjustment"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method:
        | "orange_money"
        | "mtn_money"
        | "wave"
        | "card"
        | "cash"
        | "bank_transfer"
      payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed"
      repair_status:
        | "received"
        | "diagnosis"
        | "waiting_parts"
        | "in_repair"
        | "completed"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "technician",
        "cashier",
        "commercial",
        "warehouse",
        "writer",
        "support",
        "customer",
      ],
      invoice_type: ["invoice", "receipt", "quote", "delivery_note"],
      memoire_status: [
        "received",
        "assigned",
        "in_progress",
        "review",
        "completed",
        "delivered",
        "cancelled",
      ],
      movement_type: ["in", "out", "adjustment"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: [
        "orange_money",
        "mtn_money",
        "wave",
        "card",
        "cash",
        "bank_transfer",
      ],
      payment_status: ["unpaid", "pending", "paid", "refunded", "failed"],
      repair_status: [
        "received",
        "diagnosis",
        "waiting_parts",
        "in_repair",
        "completed",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
