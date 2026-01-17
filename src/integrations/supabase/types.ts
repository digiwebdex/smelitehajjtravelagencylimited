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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_documents: {
        Row: {
          booking_id: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["tracking_status"]
          notes: string | null
          previous_status: Database["public"]["Enums"]["tracking_status"] | null
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["tracking_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["tracking_status"]
            | null
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["tracking_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["tracking_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          created_at: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          package_id: string
          passenger_count: number
          passenger_details: Json | null
          payment_method: string | null
          payment_status: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          tracking_status: Database["public"]["Enums"]["tracking_status"]
          transaction_id: string | null
          travel_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          package_id: string
          passenger_count?: number
          passenger_details?: Json | null
          payment_method?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          tracking_status?: Database["public"]["Enums"]["tracking_status"]
          transaction_id?: string | null
          travel_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          passenger_count?: number
          passenger_details?: Json | null
          payment_method?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          tracking_status?: Database["public"]["Enums"]["tracking_status"]
          transaction_id?: string | null
          travel_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          created_at: string
          details: Json
          icon_name: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          icon_name: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          icon_name?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_content: {
        Row: {
          company_description: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phones: string[] | null
          copyright_text: string | null
          created_at: string
          id: string
          quick_links: Json | null
          services_links: Json | null
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          company_description?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phones?: string[] | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          quick_links?: Json | null
          services_links?: Json | null
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          company_description?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phones?: string[] | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          quick_links?: Json | null
          services_links?: Json | null
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          background_image_url: string | null
          badge_text: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          primary_button_link: string | null
          primary_button_text: string | null
          secondary_button_link: string | null
          secondary_button_text: string | null
          stats: Json | null
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          background_image_url?: string | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          primary_button_link?: string | null
          primary_button_text?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          stats?: Json | null
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          background_image_url?: string | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          primary_button_link?: string | null
          primary_button_text?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          stats?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          page_key: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          page_key: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          page_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          label: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_active?: boolean
          label: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          booking_id: string | null
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient: string
          status: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          setting_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          setting_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          setting_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      office_locations: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          map_query: string | null
          name: string
          order_index: number
          phones: string[]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          map_query?: string | null
          name: string
          order_index?: number
          phones?: string[]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          map_query?: string | null
          name?: string
          order_index?: number
          phones?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          hotel_rating: number | null
          id: string
          image_url: string | null
          includes: string[] | null
          is_active: boolean
          price: number
          stock: number
          title: string
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          hotel_rating?: number | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          price: number
          stock?: number
          title: string
          type: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          hotel_rating?: number | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          price?: number
          stock?: number
          title?: string
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          credentials: Json
          description: string | null
          icon_name: string
          id: string
          is_enabled: boolean
          is_live_mode: boolean
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          description?: string | null
          icon_name?: string
          id?: string
          is_enabled?: boolean
          is_live_mode?: boolean
          name: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          description?: string | null
          icon_name?: string
          id?: string
          is_enabled?: boolean
          is_live_mode?: boolean
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      section_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          icon_name: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          board_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          qualifications: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          board_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          qualifications?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          board_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          qualifications?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          order_index: number
          package_name: string | null
          quote: string
          rating: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          order_index?: number
          package_name?: string | null
          quote: string
          rating?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          order_index?: number
          package_name?: string | null
          quote?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      visa_countries: {
        Row: {
          country_name: string
          created_at: string
          flag_emoji: string
          id: string
          is_active: boolean
          order_index: number
          price: number
          processing_time: string
          updated_at: string
        }
        Insert: {
          country_name: string
          created_at?: string
          flag_emoji: string
          id?: string
          is_active?: boolean
          order_index?: number
          price: number
          processing_time: string
          updated_at?: string
        }
        Update: {
          country_name?: string
          created_at?: string
          flag_emoji?: string
          id?: string
          is_active?: boolean
          order_index?: number
          price?: number
          processing_time?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      package_type: "hajj" | "umrah"
      tracking_status:
        | "order_submitted"
        | "documents_received"
        | "under_review"
        | "approved"
        | "processing"
        | "completed"
      user_role: "customer" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      package_type: ["hajj", "umrah"],
      tracking_status: [
        "order_submitted",
        "documents_received",
        "under_review",
        "approved",
        "processing",
        "completed",
      ],
      user_role: ["customer", "admin"],
    },
  },
} as const
