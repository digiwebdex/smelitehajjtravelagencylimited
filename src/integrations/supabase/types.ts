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
      about_content: {
        Row: {
          created_at: string
          history_text: string | null
          history_title: string | null
          id: string
          image_url: string | null
          mission_text: string | null
          mission_title: string | null
          stats: Json | null
          subtitle: string | null
          title: string
          updated_at: string
          values_items: Json | null
          values_title: string | null
          vision_text: string | null
          vision_title: string | null
        }
        Insert: {
          created_at?: string
          history_text?: string | null
          history_title?: string | null
          id?: string
          image_url?: string | null
          mission_text?: string | null
          mission_title?: string | null
          stats?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          values_items?: Json | null
          values_title?: string | null
          vision_text?: string | null
          vision_title?: string | null
        }
        Update: {
          created_at?: string
          history_text?: string | null
          history_title?: string | null
          id?: string
          image_url?: string | null
          mission_text?: string | null
          mission_title?: string | null
          stats?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          values_items?: Json | null
          values_title?: string | null
          vision_text?: string | null
          vision_title?: string | null
        }
        Relationships: []
      }
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
          bank_transaction_number: string | null
          bank_transfer_screenshot_url: string | null
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
          bank_transaction_number?: string | null
          bank_transfer_screenshot_url?: string | null
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
          bank_transaction_number?: string | null
          bank_transfer_screenshot_url?: string | null
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
          map_link: string | null
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
          map_link?: string | null
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
          map_link?: string | null
          order_index?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      emi_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          emi_payment_id: string
          id: string
          installment_number: number
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          emi_payment_id: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          emi_payment_id?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_installments_emi_payment_id_fkey"
            columns: ["emi_payment_id"]
            isOneToOne: false
            referencedRelation: "emi_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_payments: {
        Row: {
          advance_amount: number
          booking_id: string
          created_at: string
          emi_amount: number
          id: string
          is_emi_plan: boolean
          number_of_emis: number
          paid_emis: number
          remaining_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          advance_amount?: number
          booking_id: string
          created_at?: string
          emi_amount: number
          id?: string
          is_emi_plan?: boolean
          number_of_emis: number
          paid_emis?: number
          remaining_amount: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          booking_id?: string
          created_at?: string
          emi_amount?: number
          id?: string
          is_emi_plan?: boolean
          number_of_emis?: number
          paid_emis?: number
          remaining_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
          address_label_1: string | null
          address_label_2: string | null
          company_description: string | null
          contact_address: string | null
          contact_address_2: string | null
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
          address_label_1?: string | null
          address_label_2?: string | null
          company_description?: string | null
          contact_address?: string | null
          contact_address_2?: string | null
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
          address_label_1?: string | null
          address_label_2?: string | null
          company_description?: string | null
          contact_address?: string | null
          contact_address_2?: string | null
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
      gallery_images: {
        Row: {
          alt_text: string
          caption: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          order_index: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          alt_text?: string
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          order_index?: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          alt_text?: string
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          order_index?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_settings: {
        Row: {
          autoplay_carousel: boolean | null
          autoplay_speed: number | null
          background_color: string | null
          columns_desktop: number | null
          columns_mobile: number | null
          columns_tablet: number | null
          created_at: string
          default_view: string | null
          hover_effect: string | null
          id: string
          image_aspect_ratio: string | null
          image_border_radius: string | null
          is_enabled: boolean
          lightbox_enabled: boolean | null
          overlay_color: string | null
          show_captions: boolean | null
          show_thumbnails: boolean | null
          subtitle: string | null
          subtitle_color: string | null
          title: string
          title_color: string | null
          updated_at: string
        }
        Insert: {
          autoplay_carousel?: boolean | null
          autoplay_speed?: number | null
          background_color?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          default_view?: string | null
          hover_effect?: string | null
          id?: string
          image_aspect_ratio?: string | null
          image_border_radius?: string | null
          is_enabled?: boolean
          lightbox_enabled?: boolean | null
          overlay_color?: string | null
          show_captions?: boolean | null
          show_thumbnails?: boolean | null
          subtitle?: string | null
          subtitle_color?: string | null
          title?: string
          title_color?: string | null
          updated_at?: string
        }
        Update: {
          autoplay_carousel?: boolean | null
          autoplay_speed?: number | null
          background_color?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          default_view?: string | null
          hover_effect?: string | null
          id?: string
          image_aspect_ratio?: string | null
          image_border_radius?: string | null
          is_enabled?: boolean
          lightbox_enabled?: boolean | null
          overlay_color?: string | null
          show_captions?: boolean | null
          show_thumbnails?: boolean | null
          subtitle?: string | null
          subtitle_color?: string | null
          title?: string
          title_color?: string | null
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
          order_index: number
          primary_button_link: string | null
          primary_button_text: string | null
          secondary_button_link: string | null
          secondary_button_text: string | null
          slide_type: string
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
          order_index?: number
          primary_button_link?: string | null
          primary_button_text?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          slide_type?: string
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
          order_index?: number
          primary_button_link?: string | null
          primary_button_text?: string | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          slide_type?: string
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
      notices: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string | null
          created_at: string
          end_date: string | null
          external_link: string | null
          external_link_text: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          notice_type: string
          order_index: number
          priority: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          notice_type?: string
          order_index?: number
          priority?: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          notice_type?: string
          order_index?: number
          priority?: string
          start_date?: string | null
          title?: string
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
          exclusions: string[] | null
          flight_type: string | null
          full_description: string | null
          hotel_image_url: string | null
          hotel_images: string[] | null
          hotel_map_link: string | null
          hotel_rating: number | null
          hotel_type: string | null
          id: string
          image_url: string | null
          includes: string[] | null
          is_active: boolean
          price: number
          show_book_now: boolean | null
          show_view_details: boolean | null
          special_notes: string | null
          stock: number
          title: string
          transport_type: string | null
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          exclusions?: string[] | null
          flight_type?: string | null
          full_description?: string | null
          hotel_image_url?: string | null
          hotel_images?: string[] | null
          hotel_map_link?: string | null
          hotel_rating?: number | null
          hotel_type?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          price: number
          show_book_now?: boolean | null
          show_view_details?: boolean | null
          special_notes?: string | null
          stock?: number
          title: string
          transport_type?: string | null
          type: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          exclusions?: string[] | null
          flight_type?: string | null
          full_description?: string | null
          hotel_image_url?: string | null
          hotel_images?: string[] | null
          hotel_map_link?: string | null
          hotel_rating?: number | null
          hotel_type?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          price?: number
          show_book_now?: boolean | null
          show_view_details?: boolean | null
          special_notes?: string | null
          stock?: number
          title?: string
          transport_type?: string | null
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
          badge_text: string | null
          bg_color: string | null
          created_at: string
          custom_css: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          order_index: number | null
          section_key: string
          stats: Json | null
          subtitle: string | null
          success_rate: string | null
          text_color: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          custom_css?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number | null
          section_key: string
          stats?: Json | null
          subtitle?: string | null
          success_rate?: string | null
          text_color?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          custom_css?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order_index?: number | null
          section_key?: string
          stats?: Json | null
          subtitle?: string | null
          success_rate?: string | null
          text_color?: string | null
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
      staff_activity_log: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          staff_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          staff_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          staff_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          address: string | null
          created_at: string
          department: string | null
          employee_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          permissions: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          board_type: string
          created_at: string
          id: string
          imo_number: string | null
          is_active: boolean
          name: string
          order_index: number
          qualifications: string | null
          role: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          board_type?: string
          created_at?: string
          id?: string
          imo_number?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          qualifications?: string | null
          role: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          board_type?: string
          created_at?: string
          id?: string
          imo_number?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          qualifications?: string | null
          role?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      terminal_content: {
        Row: {
          bg_color: string | null
          created_at: string
          font_size: string | null
          id: string
          is_enabled: boolean | null
          order_index: number | null
          terminal_text: string | null
          text_color: string | null
          title: string | null
          typing_animation: boolean | null
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          is_enabled?: boolean | null
          order_index?: number | null
          terminal_text?: string | null
          text_color?: string | null
          title?: string | null
          typing_animation?: boolean | null
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          created_at?: string
          font_size?: string | null
          id?: string
          is_enabled?: boolean | null
          order_index?: number | null
          terminal_text?: string | null
          text_color?: string | null
          title?: string | null
          typing_animation?: boolean | null
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
      theme_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          border_radius: string | null
          created_at: string
          dark_mode_enabled: boolean | null
          font_family: string | null
          heading_font: string | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          created_at?: string
          dark_mode_enabled?: boolean | null
          font_family?: string | null
          heading_font?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          border_radius?: string | null
          created_at?: string
          dark_mode_enabled?: boolean | null
          font_family?: string | null
          heading_font?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visa_countries: {
        Row: {
          country_name: string
          created_at: string
          description: string | null
          documents_needed: string[] | null
          flag_emoji: string
          id: string
          is_active: boolean
          is_featured: boolean
          order_index: number
          price: number
          processing_time: string
          requirements: string[] | null
          updated_at: string
          validity_period: string | null
        }
        Insert: {
          country_name: string
          created_at?: string
          description?: string | null
          documents_needed?: string[] | null
          flag_emoji: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          order_index?: number
          price: number
          processing_time: string
          requirements?: string[] | null
          updated_at?: string
          validity_period?: string | null
        }
        Update: {
          country_name?: string
          created_at?: string
          description?: string | null
          documents_needed?: string[] | null
          flag_emoji?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          order_index?: number
          price?: number
          processing_time?: string
          requirements?: string[] | null
          updated_at?: string
          validity_period?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_staff_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      has_staff_role: {
        Args: {
          _role: Database["public"]["Enums"]["staff_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      package_type: "hajj" | "umrah"
      staff_role: "admin" | "manager" | "agent" | "support"
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
      staff_role: ["admin", "manager", "agent", "support"],
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
