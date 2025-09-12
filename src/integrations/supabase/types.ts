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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      content: {
        Row: {
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          metadata: Json | null
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          metadata?: Json | null
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      frequently_asked_questions: {
        Row: {
          ask_count: number
          created_at: string
          difficulty_level: string
          id: string
          last_asked_at: string
          question_text: string
          subject_code: string
          updated_at: string
        }
        Insert: {
          ask_count?: number
          created_at?: string
          difficulty_level?: string
          id?: string
          last_asked_at?: string
          question_text: string
          subject_code: string
          updated_at?: string
        }
        Update: {
          ask_count?: number
          created_at?: string
          difficulty_level?: string
          id?: string
          last_asked_at?: string
          question_text?: string
          subject_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          attachments: Json | null
          content_id: string
          feedback: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          status: string | null
          submission_text: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content_id: string
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          submission_text?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content_id?: string
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          submission_text?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_user_id: string
          accessor_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_user_id: string
          accessor_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_user_id?: string
          accessor_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          grade_level: number | null
          id: string
          last_name: string | null
          role: string | null
          school_name: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          grade_level?: number | null
          id?: string
          last_name?: string | null
          role?: string | null
          school_name?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          grade_level?: number | null
          id?: string
          last_name?: string | null
          role?: string | null
          school_name?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          question_text: string
          question_type: string
          topic_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_text: string
          question_type: string
          topic_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_text?: string
          question_type?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          score: number
          topic_id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          score?: number
          topic_id: string
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          score?: number
          topic_id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          additional_resources: Json | null
          content_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          solution_content: string
          solution_type: string
          title: string
          updated_at: string
        }
        Insert: {
          additional_resources?: Json | null
          content_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          solution_content: string
          solution_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          additional_resources?: Json | null
          content_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          solution_content?: string
          solution_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solutions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          subject_id: string
          subscription_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subject_id: string
          subscription_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subject_id?: string
          subscription_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_subject"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          difficulty_level: number | null
          id: string
          order_index: number | null
          sub_subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          id?: string
          order_index?: number | null
          sub_subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          id?: string
          order_index?: number | null
          sub_subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_sub_subject_id_fkey"
            columns: ["sub_subject_id"]
            isOneToOne: false
            referencedRelation: "sub_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          content_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          progress_type: string
          score: number | null
          topic_id: string
          total_points: number | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          progress_type: string
          score?: number | null
          topic_id: string
          total_points?: number | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          progress_type?: string
          score?: number | null
          topic_id?: string
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_status: {
        Args: { p_subject_id: string }
        Returns: string
      }
      get_anonymized_email: {
        Args: { email: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_platform_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_quiz_questions: {
        Args: { p_topic_id: string }
        Returns: {
          difficulty_level: number
          id: string
          options: Json
          points: number
          question_text: string
          question_type: string
          topic_id: string
        }[]
      }
      get_safe_user_display: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          grade_level: number
          id: string
          role: string
        }[]
      }
      get_student_display_info: {
        Args: { p_user_id: string }
        Returns: {
          anonymized_email: string
          full_name: string
          grade_level: number
          id: string
          role: string
          school_name: string
        }[]
      }
      get_student_list_for_teacher: {
        Args: Record<PropertyKey, never>
        Returns: {
          grade_level: number
          role_verified: string
          school_name: string
          student_name: string
        }[]
      }
      get_students_for_teacher: {
        Args: Record<PropertyKey, never>
        Returns: {
          anonymized_email: string
          full_name: string
          grade_level: number
          school_name: string
          student_id: string
        }[]
      }
      increment_question_count: {
        Args: { question_id: string }
        Returns: undefined
      }
      is_teacher_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_topic_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
