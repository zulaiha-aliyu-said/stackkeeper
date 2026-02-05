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
       };
     };
     Views: {
       [_ in never]: never;
     };
     Functions: {
       [_ in never]: never;
     };
     Enums: {
       [_ in never]: never;
     };
   };
 };