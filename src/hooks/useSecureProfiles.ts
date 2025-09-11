import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SafeUserProfile {
  id: string;
  display_name: string;
  role: string;
  grade_level: number | null;
}

export interface StudentInfo {
  student_name: string;
  grade_level: number | null;
  school_name: string | null;
  role_verified: string;
}

/**
 * Secure profile utilities that prevent email harvesting and unauthorized access
 */
export class SecureProfileService {
  private static instance: SecureProfileService;
  
  static getInstance(): SecureProfileService {
    if (!SecureProfileService.instance) {
      SecureProfileService.instance = new SecureProfileService();
    }
    return SecureProfileService.instance;
  }

  /**
   * Get safe user display information without exposing email
   */
  async getSafeUserDisplay(userId: string): Promise<SafeUserProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_safe_user_display', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching safe user display:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getSafeUserDisplay:', error);
      return null;
    }
  }

  /**
   * Get anonymized email for display purposes
   */
  async getAnonymizedEmail(email: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_anonymized_email', {
        email
      });

      if (error) {
        console.error('Error anonymizing email:', error);
        return 'Anonymous';
      }

      return data || 'Anonymous';
    } catch (error) {
      console.error('Error in getAnonymizedEmail:', error);
      return 'Anonymous';
    }
  }

  /**
   * Get student list for teachers (educational purposes only)
   * This function will only work if the current user is a teacher
   */
  async getStudentListForTeacher(): Promise<StudentInfo[]> {
    try {
      const { data, error } = await supabase.rpc('get_student_list_for_teacher');

      if (error) {
        console.error('Error fetching student list:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudentListForTeacher:', error);
      return [];
    }
  }

  /**
   * Log profile access for audit purposes
   */
  async logProfileAccess(accessedUserId: string, accessType: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profile_access_logs')
        .insert({
          accessed_user_id: accessedUserId,
          accessor_user_id: (await supabase.auth.getUser()).data.user?.id,
          access_type: accessType
        });

      if (error) {
        console.error('Error logging profile access:', error);
      }
    } catch (error) {
      console.error('Error in logProfileAccess:', error);
    }
  }

  /**
   * Check if current user has permission to view profile
   */
  async canViewProfile(targetUserId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Users can always view their own profile
      if (user.user.id === targetUserId) {
        return true;
      }

      // Check if current user is a teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.user.id)
        .single();

      return profile?.role === 'teacher';
    } catch (error) {
      console.error('Error checking profile permissions:', error);
      return false;
    }
  }
}

/**
 * React hook for secure profile operations
 */
export function useSecureProfiles() {
  const { toast } = useToast();
  const profileService = SecureProfileService.getInstance();

  const getSafeUserDisplay = async (userId: string) => {
    const canView = await profileService.canViewProfile(userId);
    if (!canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this profile",
        variant: "destructive",
      });
      return null;
    }

    await profileService.logProfileAccess(userId, 'view_safe_display');
    return await profileService.getSafeUserDisplay(userId);
  };

  const getStudentList = async () => {
    try {
      const students = await profileService.getStudentListForTeacher();
      await profileService.logProfileAccess('*', 'view_student_list');
      return students;
    } catch (error) {
      toast({
        title: "Access Denied",
        description: "Only teachers can view student information",
        variant: "destructive",
      });
      return [];
    }
  };

  const anonymizeEmail = async (email: string) => {
    return await profileService.getAnonymizedEmail(email);
  };

  return {
    getSafeUserDisplay,
    getStudentList,
    anonymizeEmail,
    canViewProfile: profileService.canViewProfile.bind(profileService),
  };
}