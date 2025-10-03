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
   * Get secure user profile with validation and logging
   */
  async getSecureProfile(userId?: string): Promise<any | null> {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      // Security validation: ensure user can only access their own profile
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user?.id !== targetUserId) {
        // Log unauthorized access attempt
        await this.logProfileAccess(targetUserId, 'unauthorized_access_attempt');
        throw new Error('Access denied: You can only view your own profile');
      }

      // Log successful access
      await this.logProfileAccess(targetUserId, 'secure_profile_access');

      // Fetch profile with additional security checks
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          username,
          bio,
          role,
          grade_level,
          school_name,
          created_at,
          updated_at,
          full_name
        `)
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;

      // Sanitize and validate returned data
      return this.sanitizeProfileData(data);
    } catch (error) {
      console.error('Error in getSecureProfile:', error);
      return null;
    }
  }

  /**
   * Sanitize profile data to prevent XSS and other attacks
   */
  private sanitizeProfileData(data: any) {
    if (!data) return null;

    return {
      ...data,
      first_name: this.sanitizeString(data.first_name),
      last_name: this.sanitizeString(data.last_name),
      username: this.sanitizeString(data.username),
      bio: this.sanitizeString(data.bio, 500),
      full_name: this.sanitizeString(data.full_name)
    };
  }

  /**
   * Sanitize string input to prevent XSS
   */
  private sanitizeString(input: string | null, maxLength?: number): string | null {
    if (!input) return null;
    
    // Remove potentially harmful characters and HTML
    const sanitized = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
    
    return maxLength ? sanitized.substring(0, maxLength) : sanitized;
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
   * Update profile with enhanced security validation
   */
  async updateSecureProfile(updates: Partial<any>): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Sanitize input data - only include non-empty values
      const sanitizedUpdates: any = {};
      
      if (updates.first_name !== undefined && updates.first_name !== null && updates.first_name.trim() !== '') {
        sanitizedUpdates.first_name = this.sanitizeString(updates.first_name);
      }
      if (updates.last_name !== undefined && updates.last_name !== null && updates.last_name.trim() !== '') {
        sanitizedUpdates.last_name = this.sanitizeString(updates.last_name);
      }
      if (updates.username !== undefined && updates.username !== null && updates.username.trim() !== '') {
        sanitizedUpdates.username = this.sanitizeString(updates.username);
      }
      if (updates.bio !== undefined) {
        sanitizedUpdates.bio = this.sanitizeString(updates.bio, 500);
      }
      if (updates.grade_level !== undefined && updates.grade_level !== null) {
        sanitizedUpdates.grade_level = updates.grade_level;
      }
      if (updates.school_name !== undefined && updates.school_name !== null && updates.school_name.trim() !== '') {
        sanitizedUpdates.school_name = this.sanitizeString(updates.school_name);
      }

      // Construct full_name if both names exist
      if (sanitizedUpdates.first_name || sanitizedUpdates.last_name) {
        const firstName = sanitizedUpdates.first_name || updates.first_name || '';
        const lastName = sanitizedUpdates.last_name || updates.last_name || '';
        if (firstName || lastName) {
          sanitizedUpdates.full_name = `${firstName} ${lastName}`.trim();
        }
      }

      console.log('Updating profile with:', sanitizedUpdates);

      // Log profile update attempt
      await this.logProfileAccess(user.user.id, 'profile_update_attempt');

      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('user_id', user.user.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      // Log successful update
      await this.logProfileAccess(user.user.id, 'profile_update_success');
      
      return true;
    } catch (error) {
      console.error('Error updating secure profile:', error);
      throw error;
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

  const getSecureProfile = async (userId?: string) => {
    try {
      return await profileService.getSecureProfile(userId);
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Failed to access profile",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const success = await profileService.updateSecureProfile(updates);
      if (success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        return true;
      } else {
        throw new Error('Update failed');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      return false;
    }
  };

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
    getSecureProfile,
    updateProfile,
    getSafeUserDisplay,
    getStudentList,
    anonymizeEmail,
    canViewProfile: profileService.canViewProfile.bind(profileService),
  };
}