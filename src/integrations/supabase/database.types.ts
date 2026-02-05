 // Flexible database types - allows Supabase queries before tables are created
 // After creating tables in Supabase, regenerate proper types
 export type Json =
   | string
   | number
   | boolean
   | null
   | { [key: string]: Json | undefined }
   | Json[];
 
 export interface Database {
   public: {
     Tables: {
       profiles: {
         Row: {
           id: string;
           email: string;
           full_name: string | null;
           avatar_url: string | null;
           created_at: string;
           updated_at: string;
         };
         Insert: {
           id: string;
           email: string;
           full_name?: string | null;
           avatar_url?: string | null;
           created_at?: string;
           updated_at?: string;
         };
         Update: {
           id?: string;
           email?: string;
           full_name?: string | null;
           avatar_url?: string | null;
           created_at?: string;
           updated_at?: string;
         };
         Relationships: [];
       };
       tools: {
         Row: {
           id: string;
           user_id: string;
           name: string;
           category: string;
           platform: string;
           price: number;
           purchase_date: string | null;
           login: string | null;
           password: string | null;
           redemption_code: string | null;
           notes: string | null;
           added_date: string;
           last_used: string | null;
           times_used: number;
           tags: string[] | null;
           tool_url: string | null;
           usage_history: Json | null;
           current_streak: number;
           longest_streak: number;
           usage_goal: number | null;
           usage_goal_period: string | null;
           annual_value: number | null;
           created_at: string;
           updated_at: string;
         };
         Insert: {
           id?: string;
           user_id: string;
           name: string;
           category: string;
           platform: string;
           price: number;
           purchase_date?: string | null;
           login?: string | null;
           password?: string | null;
           redemption_code?: string | null;
           notes?: string | null;
           added_date?: string;
           last_used?: string | null;
           times_used?: number;
           tags?: string[] | null;
           tool_url?: string | null;
           usage_history?: Json | null;
           current_streak?: number;
           longest_streak?: number;
           usage_goal?: number | null;
           usage_goal_period?: string | null;
           annual_value?: number | null;
           created_at?: string;
           updated_at?: string;
         };
         Update: {
           id?: string;
           user_id?: string;
           name?: string;
           category?: string;
           platform?: string;
           price?: number;
           purchase_date?: string | null;
           login?: string | null;
           password?: string | null;
           redemption_code?: string | null;
           notes?: string | null;
           added_date?: string;
           last_used?: string | null;
           times_used?: number;
           tags?: string[] | null;
           tool_url?: string | null;
           usage_history?: Json | null;
           current_streak?: number;
           longest_streak?: number;
           usage_goal?: number | null;
           usage_goal_period?: string | null;
           annual_value?: number | null;
           created_at?: string;
           updated_at?: string;
         };
         Relationships: [];
       };
     };
     Views: Record<string, never>;
     Functions: Record<string, never>;
     Enums: Record<string, never>;
   };
 }