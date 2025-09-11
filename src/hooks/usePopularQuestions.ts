import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PopularQuestion {
  id: string;
  question_text: string;
  subject_code: string;
  difficulty_level: string;
  ask_count: number;
  last_asked_at: string;
}

export const usePopularQuestions = () => {
  const [questions, setQuestions] = useState<PopularQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularQuestions();
  }, []);

  const fetchPopularQuestions = async () => {
    try {
      // Get the top 3 most asked questions from the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('frequently_asked_questions')
        .select('*')
        .gte('last_asked_at', oneWeekAgo.toISOString())
        .order('ask_count', { ascending: false })
        .limit(3);

      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching popular questions:', error);
      // Fallback to empty array
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const incrementQuestionCount = async (questionId: string) => {
    try {
      const { error } = await supabase.rpc('increment_question_count', {
        question_id: questionId
      });

      if (error) throw error;
      
      // Refresh the questions after incrementing
      fetchPopularQuestions();
    } catch (error) {
      console.error('Error incrementing question count:', error);
    }
  };

  return { questions, loading, refetch: fetchPopularQuestions, incrementQuestionCount };
};