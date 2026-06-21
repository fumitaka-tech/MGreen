export type AreaType = "outdoor" | "indoor";

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      areas: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: AreaType;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: AreaType;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?: AreaType;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plants: {
        Row: {
          id: string;
          area_id: string;
          nickname: string;
          species_name: string | null;
          planted_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          area_id: string;
          nickname: string;
          species_name?: string | null;
          planted_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          area_id?: string;
          nickname?: string;
          species_name?: string | null;
          planted_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      growth_logs: {
        Row: {
          id: string;
          plant_id: string;
          photo_url: string | null;
          note: string | null;
          logged_at: string;
          created_by: string | null;
          created_at: string;
          ai_insights: import("@/types/plant-ai").AiInsights | null;
        };
        Insert: {
          id?: string;
          plant_id: string;
          photo_url?: string | null;
          note?: string | null;
          logged_at?: string;
          created_by?: string | null;
          created_at?: string;
          ai_insights?: import("@/types/plant-ai").AiInsights | null;
        };
        Update: {
          id?: string;
          plant_id?: string;
          photo_url?: string | null;
          note?: string | null;
          logged_at?: string;
          created_by?: string | null;
          created_at?: string;
          ai_insights?: import("@/types/plant-ai").AiInsights | null;
        };
        Relationships: [];
      };
      growth_log_photos: {
        Row: {
          id: string;
          growth_log_id: string;
          photo_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          growth_log_id: string;
          photo_url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          growth_log_id?: string;
          photo_url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household_for_user: {
        Args: { household_name?: string };
        Returns: { id: string; name: string; created_at: string }[];
      };
      user_household_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      create_growth_log_with_photos: {
        Args: {
          p_plant_id: string;
          p_note?: string | null;
          p_logged_at?: string;
          p_photo_urls_json?: string[];
          p_ai_insights_json?: import("@/types/plant-ai").AiInsights | null;
        };
        Returns: string;
      };
      update_growth_log_with_photos: {
        Args: {
          p_log_id: string;
          p_plant_id: string;
          p_note?: string | null;
          p_logged_at?: string;
          p_photos_json?: { id?: string; url: string }[];
          p_ai_insights_json?: import("@/types/plant-ai").AiInsights | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type Area = Database["public"]["Tables"]["areas"]["Row"];
export type AreaOption = Pick<Area, "id" | "name" | "type">;
export type Plant = Database["public"]["Tables"]["plants"]["Row"];
export type GrowthLog = Database["public"]["Tables"]["growth_logs"]["Row"];
export type GrowthLogPhoto =
  Database["public"]["Tables"]["growth_log_photos"]["Row"];

export type PlantWithArea = Plant & {
  areas: Pick<Area, "id" | "name" | "type">;
};

export type GrowthLogWithPlant = GrowthLog & {
  plants: Pick<Plant, "id" | "nickname">;
};

export type GrowthLogWithPhotos = GrowthLog & {
  growth_log_photos: Pick<GrowthLogPhoto, "id" | "photo_url" | "sort_order">[];
};
