import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'teacher' | 'student';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        console.log('Fetching roles for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        console.log('User roles query result:', { data, error });

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          const userRoles = data?.map(r => r.role as UserRole) || [];
          console.log('User roles set to:', userRoles);
          setRoles(userRoles);
        }
      } catch (e) {
        console.error('Unexpected error fetching roles:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const isTeacher = hasRole('teacher');
  const isAdmin = hasRole('admin');
  const isStudent = hasRole('student');

  return {
    roles,
    hasRole,
    isTeacher,
    isAdmin,
    isStudent,
    loading,
  };
};
