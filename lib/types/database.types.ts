// Auto-generated via: supabase gen types typescript --project-id <id> > lib/types/database.types.ts
// Manually written for MVP bootstrap — regenerate after Supabase project is connected.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: "user" | "admin";
          is_allowed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "user" | "admin";
          is_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "user" | "admin";
          is_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_weeks: {
        Row: {
          id: string;
          week_start: string;
          is_published: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          is_published?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week_start?: string;
          is_published?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          menu_week_id: string;
          restaurant_id: string | null;
          day_of_week: number;
          name: string;
          description: string | null;
          dietary_tags: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_week_id: string;
          restaurant_id?: string | null;
          day_of_week: number;
          name: string;
          description?: string | null;
          dietary_tags?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_week_id?: string;
          restaurant_id?: string | null;
          day_of_week?: number;
          name?: string;
          description?: string | null;
          dietary_tags?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string;
          order_date: string;
          status: OrderStatus;
          special_notes: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id: string;
          order_date: string;
          status?: OrderStatus;
          special_notes?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          menu_item_id?: string;
          order_date?: string;
          status?: OrderStatus;
          special_notes?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurant_submission_log: {
        Row: {
          id: string;
          order_date: string;
          restaurant_id: string;
          status: SubmissionStatus;
          submitted_at: string | null;
          submitted_by: string | null;
          confirmed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_date: string;
          restaurant_id: string;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          submitted_by?: string | null;
          confirmed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_date?: string;
          restaurant_id?: string;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          submitted_by?: string | null;
          confirmed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exception_requests: {
        Row: {
          id: string;
          order_id: string | null;
          requested_by: string;
          request_type: ExceptionRequestType;
          reason: string;
          status: ExceptionRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          resolution_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          requested_by: string;
          request_type: ExceptionRequestType;
          reason: string;
          status?: ExceptionRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          requested_by?: string;
          request_type?: ExceptionRequestType;
          reason?: string;
          status?: ExceptionRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: AnnouncementType;
          target_date: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          type?: AnnouncementType;
          target_date?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          type?: AnnouncementType;
          target_date?: string | null;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never; // audit_logs are immutable
      };
    };
    Functions: {
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      is_allowed_user: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
  };
};

// ============================================================
// Derived application types
// ============================================================

export type OrderStatus =
  | "placed"
  | "cancelled"
  | "submitted"
  | "delivered"
  | "picked_up"
  | "no_show_candidate"
  | "no_show";

export type SubmissionStatus =
  | "not_submitted"
  | "submitted"
  | "confirmed"
  | "issue_reported";

export type ExceptionRequestType = "late_cancel" | "late_order" | "other";

export type ExceptionRequestStatus =
  | "pending"
  | "reviewed"
  | "resolved"
  | "rejected";

export type AnnouncementType = "general" | "menu_change" | "closure";

export type UserRole = "user" | "admin";

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type MenuWeek = Database["public"]["Tables"]["menu_weeks"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type RestaurantSubmissionLog =
  Database["public"]["Tables"]["restaurant_submission_log"]["Row"];
export type ExceptionRequest =
  Database["public"]["Tables"]["exception_requests"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
