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
      // Get subject count
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .in('code', ['BST', 'PVS', 'NV']);

      // Get student count (users with student role or no role - default is student)
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .or('role.eq.student,role.is.null');

      // Calculate success rate based on quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions');

      let successRate = 0;
      if (quizAttempts && quizAttempts.length > 0) {
        const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
        const totalPossible = quizAttempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
        successRate = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      }

      setStats({
        subjectCount: subjects?.length || 0,
        studentCount: students?.length || 0,
        successRate: successRate,
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