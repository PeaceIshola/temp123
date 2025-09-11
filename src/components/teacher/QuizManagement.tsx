import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Quiz {
  topic_id: string;
  topic_title: string;
  question_count: number;
  total_points: number;
  content_title: string;
  content_id: string;
}

const QuizManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('content')
      .select(`
        id,
        title,
        topic_id,
        topics!inner(title)
      `)
      .eq('content_type', 'experiment')
      .eq('created_by', user?.id);

    if (data) {
      const quizData = await Promise.all(
        data.map(async (content) => {
          const { data: questions } = await supabase
            .from('questions')
            .select('points')
            .eq('topic_id', content.topic_id);

          return {
            topic_id: content.topic_id,
            topic_title: content.topics.title,
            question_count: questions?.length || 0,
            total_points: questions?.reduce((sum, q) => sum + q.points, 0) || 0,
            content_title: content.title,
            content_id: content.id
          };
        })
      );

      setQuizzes(quizData);
    }
  };

  const deleteQuiz = async (topicId: string, contentId: string) => {
    setLoading(true);
    try {
      // Delete questions first
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('topic_id', topicId);

      if (questionsError) throw questionsError;

      // Delete content entry
      const { error: contentError } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (contentError) throw contentError;

      toast({
        title: "Success!",
        description: "Quiz deleted successfully",
      });

      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Your Quizzes ({quizzes.length})
        </CardTitle>
        <CardDescription>
          Manage your created quizzes and exercises
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No quizzes created yet. Create your first quiz in the "Create Quiz" tab.
          </p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz.content_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{quiz.content_title}</h4>
                  <p className="text-sm text-muted-foreground">{quiz.topic_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {quiz.question_count} {quiz.question_count === 1 ? 'question' : 'questions'}
                    </Badge>
                    <Badge variant="outline">
                      {quiz.total_points} {quiz.total_points === 1 ? 'point' : 'points'}
                    </Badge>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{quiz.content_title}"? This will also delete all questions and student attempts. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteQuiz(quiz.topic_id, quiz.content_id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizManagement;