export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dynamic_column_values: {
        Row: {
          column_id: string | null
          created_at: string
          id: string
          project_id: string | null
          value: string | null
        }
        Insert: {
          column_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          value?: string | null
        }
        Update: {
          column_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_column_values_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "dynamic_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_column_values_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_columns: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
          password: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          password: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          password?: string
          username?: string
        }
        Relationships: []
      }
      internship_dynamic_column_values: {
        Row: {
          column_id: string | null
          created_at: string
          id: string
          internship_id: string | null
          value: string | null
        }
        Insert: {
          column_id?: string | null
          created_at?: string
          id?: string
          internship_id?: string | null
          value?: string | null
        }
        Update: {
          column_id?: string | null
          created_at?: string
          id?: string
          internship_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internship_dynamic_column_values_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "internship_dynamic_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_dynamic_column_values_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_dynamic_columns: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      internships: {
        Row: {
          created_at: string
          domain: string | null
          email: string | null
          ending_date: string | null
          faculty_coordinator: string | null
          id: string
          internship_duration: number | null
          name: string
          noc_url: string | null
          offer_letter_url: string | null
          organization_name: string | null
          phone_no: string | null
          position: string | null
          ppo_url: string | null
          program: string | null
          roll_no: string
          semester: string | null
          session: string | null
          starting_date: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          email?: string | null
          ending_date?: string | null
          faculty_coordinator?: string | null
          id?: string
          internship_duration?: number | null
          name: string
          noc_url?: string | null
          offer_letter_url?: string | null
          organization_name?: string | null
          phone_no?: string | null
          position?: string | null
          ppo_url?: string | null
          program?: string | null
          roll_no: string
          semester?: string | null
          session?: string | null
          starting_date?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          email?: string | null
          ending_date?: string | null
          faculty_coordinator?: string | null
          id?: string
          internship_duration?: number | null
          name?: string
          noc_url?: string | null
          offer_letter_url?: string | null
          organization_name?: string | null
          phone_no?: string | null
          position?: string | null
          ppo_url?: string | null
          program?: string | null
          roll_no?: string
          semester?: string | null
          session?: string | null
          starting_date?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          domain: string | null
          faculty_coordinator: string | null
          faculty_mentor: string | null
          group_no: string
          id: string
          industry_mentor: string | null
          presentation_url: string | null
          progress_form_url: string | null
          report_url: string | null
          semester: string | null
          session: string | null
          title: string
          updated_at: string
          year: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          faculty_coordinator?: string | null
          faculty_mentor?: string | null
          group_no: string
          id?: string
          industry_mentor?: string | null
          presentation_url?: string | null
          progress_form_url?: string | null
          report_url?: string | null
          semester?: string | null
          session?: string | null
          title: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          faculty_coordinator?: string | null
          faculty_mentor?: string | null
          group_no?: string
          id?: string
          industry_mentor?: string | null
          presentation_url?: string | null
          progress_form_url?: string | null
          report_url?: string | null
          semester?: string | null
          session?: string | null
          title?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          email: string | null
          group_id: string | null
          id: string
          name: string
          program: string | null
          roll_no: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          group_id?: string | null
          id?: string
          name: string
          program?: string | null
          roll_no: string
        }
        Update: {
          created_at?: string
          email?: string | null
          group_id?: string | null
          id?: string
          name?: string
          program?: string | null
          roll_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
