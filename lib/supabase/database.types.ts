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
        Relationships: [];
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      connected_accounts: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          provider: "garmin" | "strava" | "google";
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "garmin" | "strava" | "google";
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: "garmin" | "strava" | "google";
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      workouts: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          source: "garmin" | "strava" | "manual";
          discipline: "swim" | "bike" | "run" | "gym" | "race";
          date: string;
          duration_sec: number | null;
          distance_m: number | null;
          avg_hr: number | null;
          max_hr: number | null;
          calories: number | null;
          tss: number | null;
          normalized_power: number | null;
          avg_pace: number | null;
          hrv: number | null;
          raw_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: "garmin" | "strava" | "manual";
          discipline: "swim" | "bike" | "run" | "gym" | "race";
          date: string;
          duration_sec?: number | null;
          distance_m?: number | null;
          avg_hr?: number | null;
          max_hr?: number | null;
          calories?: number | null;
          tss?: number | null;
          normalized_power?: number | null;
          avg_pace?: number | null;
          hrv?: number | null;
          raw_data?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
      };
      training_plans: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          week_start: string;
          week_end: string;
          week_notes: string | null;
          source_filename: string | null;
          raw_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          week_start: string;
          week_end: string;
          week_notes?: string | null;
          source_filename?: string | null;
          raw_json?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["training_plans"]["Insert"]
        >;
      };
      planned_workouts: {
        Relationships: [];
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          date: string;
          discipline: "swim" | "bike" | "run" | "gym" | "race";
          title: string;
          description: string | null;
          duration_min: number | null;
          distance_m: number | null;
          target_tss: number | null;
          intensity: string | null;
          structure: Json;
          sort_order: number;
          status: "planned" | "completed" | "partial" | "skipped";
          completed_workout_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          date: string;
          discipline: "swim" | "bike" | "run" | "gym" | "race";
          title: string;
          description?: string | null;
          duration_min?: number | null;
          distance_m?: number | null;
          target_tss?: number | null;
          intensity?: string | null;
          structure?: Json;
          sort_order?: number;
          status?: "planned" | "completed" | "partial" | "skipped";
          completed_workout_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["planned_workouts"]["Insert"]
        >;
      };
      daily_health: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          date: string;
          resting_hr: number | null;
          hrv_score: number | null;
          sleep_hours: number | null;
          sleep_quality: number | null;
          body_battery: number | null;
          steps: number | null;
          stress_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          resting_hr?: number | null;
          hrv_score?: number | null;
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          body_battery?: number | null;
          steps?: number | null;
          stress_score?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_health"]["Insert"]>;
      };
      readiness_scores: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          date: string;
          overall_score: number | null;
          swim_score: number | null;
          bike_score: number | null;
          run_score: number | null;
          fatigue_score: number | null;
          sleep_score: number | null;
          hrv_score: number | null;
          recommendation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          overall_score?: number | null;
          swim_score?: number | null;
          bike_score?: number | null;
          run_score?: number | null;
          fatigue_score?: number | null;
          sleep_score?: number | null;
          hrv_score?: number | null;
          recommendation?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["readiness_scores"]["Insert"]
        >;
      };
      push_subscriptions: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Insert"]
        >;
      };
      weekly_reviews: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          total_swim_km: number | null;
          total_bike_km: number | null;
          total_run_km: number | null;
          total_training_hours: number | null;
          avg_readiness: number | null;
          ai_summary: string | null;
          ai_tips: string | null;
          goals_met: boolean[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          total_swim_km?: number | null;
          total_bike_km?: number | null;
          total_run_km?: number | null;
          total_training_hours?: number | null;
          avg_readiness?: number | null;
          ai_summary?: string | null;
          ai_tips?: string | null;
          goals_met?: boolean[] | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["weekly_reviews"]["Insert"]
        >;
      };
      calendar_events: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          google_event_id: string | null;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string;
          type: "training" | "academic" | "personal" | "project";
          synced_at: string | null;
          local_changes: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_event_id?: string | null;
          title: string;
          description?: string | null;
          start_at: string;
          end_at: string;
          type?: "training" | "academic" | "personal" | "project";
          synced_at?: string | null;
          local_changes?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["calendar_events"]["Insert"]
        >;
      };
      dev_projects: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "idea" | "active" | "paused" | "done";
          stack: string[] | null;
          progress_percent: number | null;
          github_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: "idea" | "active" | "paused" | "done";
          stack?: string[] | null;
          progress_percent?: number | null;
          github_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dev_projects"]["Insert"]>;
      };
      academic_records: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          subject: string;
          type: "exam" | "assignment" | "course";
          grade: number | null;
          max_grade: number | null;
          date: string | null;
          notes: string | null;
          semester: string | null;
          institution: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          type: "exam" | "assignment" | "course";
          grade?: number | null;
          max_grade?: number | null;
          date?: string | null;
          notes?: string | null;
          semester?: string | null;
          institution?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["academic_records"]["Insert"]
        >;
      };
      daily_plans: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          date: string;
          time_blocks: Json;
          top_3_goals: string[] | null;
          notes: string | null;
          mood_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          time_blocks?: Json;
          top_3_goals?: string[] | null;
          notes?: string | null;
          mood_score?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_plans"]["Insert"]>;
      };
      habits: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          frequency: "daily" | "weekly";
          target_count: number | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          frequency?: "daily" | "weekly";
          target_count?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>;
      };
      habit_logs: {
        Relationships: [];
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          date: string;
          completed: boolean;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          date: string;
          completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["habit_logs"]["Insert"]>;
      };
      ai_chat_messages: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          context_snapshot: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          context_snapshot?: Json | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ai_chat_messages"]["Insert"]
        >;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      oauth_provider: "garmin" | "strava" | "google";
      workout_source: "garmin" | "strava" | "manual";
      workout_discipline: "swim" | "bike" | "run" | "gym" | "race";
      calendar_event_type: "training" | "academic" | "personal" | "project";
      dev_project_status: "idea" | "active" | "paused" | "done";
      academic_record_type: "exam" | "assignment" | "course";
      habit_frequency: "daily" | "weekly";
      ai_chat_role: "user" | "assistant";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
