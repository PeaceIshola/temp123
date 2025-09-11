import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Statistics {
  subjectCount: number;
  studentCount: number;
  successRate: number;
}

export const useStatistics = () => {
  const [stats, setStats] = useState<Statistics>({
    subjectCount: 0,
    studentCount: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Use the security definer function to get statistics
      const { data, error } = await supabase.rpc('get_platform_statistics');
      
      if (error) throw error;
      
      // Type assertion for the RPC response
      const stats = data as { subjectCount: number; studentCount: number; successRate: number };
      
      setStats({
        subjectCount: stats.subjectCount || 0,
        studentCount: stats.studentCount || 0,
        successRate: stats.successRate || 0,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fallback to default values
      setStats({
        subjectCount: 3,
        studentCount: 0,
        successRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStatistics };
};