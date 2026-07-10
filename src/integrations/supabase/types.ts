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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ceo_notes: {
        Row: {
          biggest_bottleneck: string
          biggest_win: string
          created_at: string
          date: string
          id: string
          notes: string
          todays_focus: string
          updated_at: string
        }
        Insert: {
          biggest_bottleneck?: string
          biggest_win?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string
          todays_focus?: string
          updated_at?: string
        }
        Update: {
          biggest_bottleneck?: string
          biggest_win?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string
          todays_focus?: string
          updated_at?: string
        }
        Relationships: []
      }
      churn_events: {
        Row: {
          churn_date_clamped: boolean
          churn_date_estimated: boolean
          created_at: string
          date: string
          email: string | null
          first_name: string | null
          id: string
          joined_date: string | null
          last_name: string | null
          ltv: number
          ltv_exceeds_tenure: boolean
          notes: string | null
          price_point: number
          recurring_interval: string
          tier: string | null
        }
        Insert: {
          churn_date_clamped?: boolean
          churn_date_estimated?: boolean
          created_at?: string
          date?: string
          email?: string | null
          first_name?: string | null
          id?: string
          joined_date?: string | null
          last_name?: string | null
          ltv?: number
          ltv_exceeds_tenure?: boolean
          notes?: string | null
          price_point: number
          recurring_interval?: string
          tier?: string | null
        }
        Update: {
          churn_date_clamped?: boolean
          churn_date_estimated?: boolean
          created_at?: string
          date?: string
          email?: string | null
          first_name?: string | null
          id?: string
          joined_date?: string | null
          last_name?: string | null
          ltv?: number
          ltv_exceeds_tenure?: boolean
          notes?: string | null
          price_point?: number
          recurring_interval?: string
          tier?: string | null
        }
        Relationships: []
      }
      daily_acquisitions: {
        Row: {
          ad_conv_27: number
          ad_conv_333: number
          ad_conv_47: number
          ad_spend: number
          created_at: string
          date: string
          id: string
          organic_27: number
          organic_333: number
          organic_47: number
          organic_source: string
          revenue: number
        }
        Insert: {
          ad_conv_27?: number
          ad_conv_333?: number
          ad_conv_47?: number
          ad_spend?: number
          created_at?: string
          date: string
          id?: string
          organic_27?: number
          organic_333?: number
          organic_47?: number
          organic_source?: string
          revenue?: number
        }
        Update: {
          ad_conv_27?: number
          ad_conv_333?: number
          ad_conv_47?: number
          ad_spend?: number
          created_at?: string
          date?: string
          id?: string
          organic_27?: number
          organic_333?: number
          organic_47?: number
          organic_source?: string
          revenue?: number
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          about_page_traffic: number
          created_at: string
          date: string
          discovery_rank: number
          group_activity: number
          id: string
          members: number
          mrr: number
          profile_activity: number
          updated_at: string
        }
        Insert: {
          about_page_traffic?: number
          created_at?: string
          date: string
          discovery_rank?: number
          group_activity?: number
          id?: string
          members?: number
          mrr?: number
          profile_activity?: number
          updated_at?: string
        }
        Update: {
          about_page_traffic?: number
          created_at?: string
          date?: string
          discovery_rank?: number
          group_activity?: number
          id?: string
          members?: number
          mrr?: number
          profile_activity?: number
          updated_at?: string
        }
        Relationships: []
      }
      funnel_daily: {
        Row: {
          ad_spend: number
          created_at: string
          date: string
          funnel: string
          futureproof_revenue: number
          futureproof_t27: number
          futureproof_t333: number
          futureproof_t47: number
          id: string
          intensive_revenue: number
          notes: string
          registrations_organic: number
          registrations_paid: number
          updated_at: string
          workshop_id: string | null
          workshop_revenue: number
        }
        Insert: {
          ad_spend?: number
          created_at?: string
          date: string
          funnel: string
          futureproof_revenue?: number
          futureproof_t27?: number
          futureproof_t333?: number
          futureproof_t47?: number
          id?: string
          intensive_revenue?: number
          notes?: string
          registrations_organic?: number
          registrations_paid?: number
          updated_at?: string
          workshop_id?: string | null
          workshop_revenue?: number
        }
        Update: {
          ad_spend?: number
          created_at?: string
          date?: string
          funnel?: string
          futureproof_revenue?: number
          futureproof_t27?: number
          futureproof_t333?: number
          futureproof_t47?: number
          id?: string
          intensive_revenue?: number
          notes?: string
          registrations_organic?: number
          registrations_paid?: number
          updated_at?: string
          workshop_id?: string | null
          workshop_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_daily_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_revenue: {
        Row: {
          churned_mrr: number | null
          contraction_mrr: number | null
          created_at: string
          ending_mrr: number | null
          expansion_mrr: number | null
          id: string
          includes_declines: boolean
          month_start: string
          mrr_retention_pct_reported: number | null
          new_mrr: number | null
          reactivation_mrr: number | null
          revenue_churn_pct: number | null
          starting_mrr: number | null
          updated_at: string
        }
        Insert: {
          churned_mrr?: number | null
          contraction_mrr?: number | null
          created_at?: string
          ending_mrr?: number | null
          expansion_mrr?: number | null
          id?: string
          includes_declines?: boolean
          month_start: string
          mrr_retention_pct_reported?: number | null
          new_mrr?: number | null
          reactivation_mrr?: number | null
          revenue_churn_pct?: number | null
          starting_mrr?: number | null
          updated_at?: string
        }
        Update: {
          churned_mrr?: number | null
          contraction_mrr?: number | null
          created_at?: string
          ending_mrr?: number | null
          expansion_mrr?: number | null
          id?: string
          includes_declines?: boolean
          month_start?: string
          mrr_retention_pct_reported?: number | null
          new_mrr?: number | null
          reactivation_mrr?: number | null
          revenue_churn_pct?: number | null
          starting_mrr?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      strategy_notes: {
        Row: {
          created_at: string
          id: string
          source_conversation_id: string | null
          summary: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_conversation_id?: string | null
          summary: string
        }
        Update: {
          created_at?: string
          id?: string
          source_conversation_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_notes_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          is_completed: boolean
          is_default: boolean
          label: string
          sort_order: number
          updated_at: string
          weight: number
        }
        Insert: {
          category: string
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean
          is_default?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean
          is_default?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      trial_cohorts: {
        Row: {
          ad_spend_attributed: number
          created_at: string
          day30_still_paid: number | null
          day7_paid: number | null
          first_payment_revenue: number
          funnel: string
          id: string
          notes: string
          trial_start_date: string
          trial_starts: number
          updated_at: string
        }
        Insert: {
          ad_spend_attributed?: number
          created_at?: string
          day30_still_paid?: number | null
          day7_paid?: number | null
          first_payment_revenue?: number
          funnel: string
          id?: string
          notes?: string
          trial_start_date: string
          trial_starts?: number
          updated_at?: string
        }
        Update: {
          ad_spend_attributed?: number
          created_at?: string
          day30_still_paid?: number | null
          day7_paid?: number | null
          first_payment_revenue?: number
          funnel?: string
          id?: string
          notes?: string
          trial_start_date?: string
          trial_starts?: number
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
      workshops: {
        Row: {
          attended: number | null
          created_at: string
          id: string
          intensive_applications: number
          intensive_closes: number
          intensive_declined: number
          intensive_price: number
          intensive_waitlist_mode: boolean
          meta_attributed_registrations: number
          notes: string
          registration_window_end: string
          registration_window_start: string
          title: string
          total_registrations: number
          updated_at: string
          workshop_date: string
        }
        Insert: {
          attended?: number | null
          created_at?: string
          id?: string
          intensive_applications?: number
          intensive_closes?: number
          intensive_declined?: number
          intensive_price: number
          intensive_waitlist_mode?: boolean
          meta_attributed_registrations?: number
          notes?: string
          registration_window_end: string
          registration_window_start: string
          title?: string
          total_registrations?: number
          updated_at?: string
          workshop_date: string
        }
        Update: {
          attended?: number | null
          created_at?: string
          id?: string
          intensive_applications?: number
          intensive_closes?: number
          intensive_declined?: number
          intensive_price?: number
          intensive_waitlist_mode?: boolean
          meta_attributed_registrations?: number
          notes?: string
          registration_window_end?: string
          registration_window_start?: string
          title?: string
          total_registrations?: number
          updated_at?: string
          workshop_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
