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
      admin_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      flashcard_progress: {
        Row: {
          correct_count: number | null
          created_at: string
          flashcard_id: string
          id: string
          incorrect_count: number | null
          last_studied_at: string | null
          mastery_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_count?: number | null
          created_at?: string
          flashcard_id: string
          id?: string
          incorrect_count?: number | null
          last_studied_at?: string | null
          mastery_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_count?: number | null
          created_at?: string
          flashcard_id?: string
          id?: string
          incorrect_count?: number | null
          last_studied_at?: string | null
          mastery_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          content_id: string
          created_at: string
          created_by: string | null
          difficulty_level: number | null
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          content_id: string
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          content_id?: string
          created_at?: string
          created_by?: string | null
          difficulty_level?: number | null
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          is_accepted: boolean | null
          question_id: string
          updated_at: string
          user_id: string
          votes: number | null
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          question_id: string
          updated_at?: string
          user_id: string
          votes?: number | null
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          question_id?: string
          updated_at?: string
          user_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "forum_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_questions: {
        Row: {
          created_at: string
          difficulty_level: string
          id: string
          is_answered: boolean | null
          question_text: string
          subject_code: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string
          id?: string
          is_answered?: boolean | null
          question_text: string
          subject_code: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string
          id?: string
          is_answered?: boolean | null
          question_text?: string
          subject_code?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      homework_help_questions: {
        Row: {
          created_at: string
          difficulty_level: string | null
          id: string
          question_text: string
          responded_at: string | null
          status: string
          subject_code: string
          teacher_id: string | null
          teacher_response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string | null
          id?: string
          question_text: string
          responded_at?: string | null
          status?: string
          subject_code: string
          teacher_id?: string | null
          teacher_response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string | null
          id?: string
          question_text?: string
          responded_at?: string | null
          status?: string
          subject_code?: string
          teacher_id?: string | null
          teacher_response?: string | null
          updated_at?: string
          user_id?: string
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
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_user_id: string
          accessor_user_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_user_id?: string
          accessor_user_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      profile_privacy_settings: {
        Row: {
          created_at: string | null
          hide_full_name: boolean | null
          hide_grade_level: boolean | null
          hide_school_name: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hide_full_name?: boolean | null
          hide_grade_level?: boolean | null
          hide_school_name?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hide_full_name?: boolean | null
          hide_grade_level?: boolean | null
          hide_school_name?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
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
      sensitive_profile_data: {
        Row: {
          created_at: string | null
          email_access_count: number | null
          email_hash: string
          encrypted_email: string
          id: string
          last_email_access: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_access_count?: number | null
          email_hash: string
          encrypted_email: string
          id?: string
          last_email_access?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_access_count?: number | null
          email_hash?: string
          encrypted_email?: string
          id?: string
          last_email_access?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          id: string
          subscriptions: Json
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          subscriptions?: Json
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          subscriptions?: Json
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          assignment_reason?: string
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      check_content_access: { Args: { p_content_id: string }; Returns: boolean }
      check_profile_access_rate: { Args: never; Returns: boolean }
      check_subscription_status: {
        Args: { p_subject_id: string }
        Returns: string
      }
      check_user_subject_subscription: {
        Args: { p_subject_id: string; p_user_id: string }
        Returns: string
      }
      delete_profile_as_admin: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      detect_email_harvesting: {
        Args: never
        Returns: {
          attacker_user_id: string
          attempt_count: number
          first_attempt: string
          last_attempt: string
          risk_level: string
        }[]
      }
      detect_profile_enumeration_attempt: {
        Args: { accessing_user_id: string }
        Returns: boolean
      }
      detect_suspicious_profile_access: {
        Args: never
        Returns: {
          access_count: number
          last_access: string
          user_id: string
        }[]
      }
      generate_auto_flashcards: {
        Args: {
          p_content_id: string
          p_content_title: string
          p_content_type: string
        }
        Returns: undefined
      }
      generate_missing_flashcards: {
        Args: never
        Returns: {
          content_id: string
          flashcards_created: number
          title: string
        }[]
      }
      get_admin_overview_counts: { Args: never; Returns: Json }
      get_admin_ticket_stats: { Args: never; Returns: Json }
      get_anonymized_email: { Args: { email: string }; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_educational_student_data: {
        Args: never
        Returns: {
          display_name: string
          grade_level: number
          role_verified: string
          school_name: string
          student_id: string
        }[]
      }
      get_minimal_profile_info: {
        Args: { target_user_id: string }
        Returns: {
          display_name: string
          is_own_profile: boolean
          role: string
        }[]
      }
      get_my_email: { Args: never; Returns: string }
      get_platform_statistics: { Args: never; Returns: Json }
      get_profiles_for_admin: {
        Args: never
        Returns: {
          bio: string
          created_at: string
          email: string
          first_name: string
          full_name: string
          grade_level: number
          last_name: string
          profile_id: string
          role: string
          school_name: string
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_public_forum_answers: {
        Args: { p_question_id: string }
        Returns: {
          anonymous_id: string
          answer_text: string
          created_at: string
          id: string
          is_accepted: boolean
          is_own_answer: boolean
          posted_by: string
          question_id: string
          votes: number
        }[]
      }
      get_public_forum_questions: {
        Args: never
        Returns: {
          anonymous_id: string
          created_at: string
          difficulty_level: string
          id: string
          is_answered: boolean
          is_own_question: boolean
          posted_by: string
          question_text: string
          subject_code: string
          tags: string[]
          title: string
        }[]
      }
      get_question_with_student_info: {
        Args: { question_id: string }
        Returns: {
          created_at: string
          difficulty_level: string
          id: string
          is_answered: boolean
          question_text: string
          student_grade: number
          student_name: string
          subject_code: string
          tags: string[]
          title: string
        }[]
      }
      get_quiz_metadata: {
        Args: { p_topic_id: string }
        Returns: {
          question_count: number
          total_points: number
        }[]
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
      get_quiz_results_with_answers: {
        Args: { p_topic_id: string }
        Returns: {
          correct_answer: string
          difficulty_level: number
          explanation: string
          is_correct: boolean
          options: Json
          points: number
          question_id: string
          question_text: string
          question_type: string
          user_answer: string
        }[]
      }
      get_safe_profile: {
        Args: { target_user_id: string }
        Returns: {
          bio: string
          full_name: string
          grade_level: number
          id: string
          is_own_profile: boolean
          role: string
          school_name: string
          user_id: string
        }[]
      }
      get_safe_profile_display: {
        Args: { target_user_id: string }
        Returns: {
          display_name: string
          grade_level: number
          id: string
          role: string
          school_name: string
        }[]
      }
      get_safe_profile_for_user: {
        Args: { target_user_id?: string }
        Returns: {
          bio: string
          created_at: string
          first_name: string
          full_name: string
          grade_level: number
          id: string
          last_name: string
          role: string
          school_name: string
          updated_at: string
          user_id: string
          username: string
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
      get_secure_profile_display: {
        Args: { target_user_id: string }
        Returns: {
          display_name: string
          grade_level: number
          id: string
          is_own_profile: boolean
          role: string
          school_name: string
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
      get_student_for_educational_purpose: {
        Args: { p_purpose: string; p_student_id: string }
        Returns: {
          contact_method: string
          grade_level: number
          school_name: string
          student_name: string
        }[]
      }
      get_student_list_for_teacher: {
        Args: never
        Returns: {
          grade_level: number
          role_verified: string
          school_name: string
          student_name: string
        }[]
      }
      get_students_for_teacher: {
        Args: never
        Returns: {
          anonymized_email: string
          full_name: string
          grade_level: number
          school_name: string
          student_id: string
        }[]
      }
      get_suspicious_activities: {
        Args: never
        Returns: {
          activity_count: number
          activity_type: string
          first_occurrence: string
          last_occurrence: string
          user_id: string
        }[]
      }
      get_teachers_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          full_name: string
          last_name: string
          school_name: string
          teacher_id: string
          updated_at: string
        }[]
      }
      get_user_email_secure: {
        Args: { target_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_email: { Args: { email_address: string }; Returns: string }
      increment_question_count: {
        Args: { question_id: string }
        Returns: undefined
      }
      is_teacher_or_admin: { Args: never; Returns: boolean }
      log_public_access_attempt: { Args: never; Returns: undefined }
      log_student_data_access: {
        Args: {
          access_type: string
          accessed_function: string
          additional_info?: Json
        }
        Returns: undefined
      }
      revoke_user_role: {
        Args: {
          revocation_reason?: string
          role_to_revoke: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_topic_id: string }
        Returns: Json
      }
      sync_profile_roles_to_user_roles: { Args: never; Returns: undefined }
      update_profile_as_admin: {
        Args: {
          p_bio?: string
          p_first_name?: string
          p_full_name?: string
          p_grade_level?: number
          p_last_name?: string
          p_profile_id: string
          p_role?: string
          p_school_name?: string
          p_username?: string
        }
        Returns: undefined
      }
      verify_profile_access: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      verify_rls_protection: {
        Args: never
        Returns: {
          has_public_deny_policy: boolean
          has_rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
