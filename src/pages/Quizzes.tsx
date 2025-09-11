import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, BookOpen, Clock, Trophy, Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Quiz {
  id: string;
  title: string;
  topic_id: string;
  topic_title: string;
  subject_code: string;
  question_count: number;
  total_points: number;
  difficulty_level: number;
  created_at: string;
}

const QuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // Get all published quiz content
      const { data: quizContent } = await supabase
        .from('content')
        .select(`
          id,
          title,
          topic_id,
          created_at,
          topics!inner(
            title,
            difficulty_level,
            sub_subjects!inner(
              subjects!inner(code)
            )
          )
        `)
        .eq('content_type', 'experiment')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (quizContent) {
        const quizData = await Promise.all(
          quizContent.map(async (content) => {
            const { data: questions } = await supabase
              .from('questions')
              .select('points')
              .eq('topic_id', content.topic_id);

            return {
              id: content.id,
              title: content.title,
              topic_id: content.topic_id,
              topic_title: content.topics.title,
              subject_code: content.topics.sub_subjects.subjects.code,
              question_count: questions?.length || 0,
              total_points: questions?.reduce((sum, q) => sum + q.points, 0) || 0,
              difficulty_level: content.topics.difficulty_level || 1,
              created_at: content.created_at
            };
          })
        );

        setQuizzes(quizData);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to take quizzes.",
      });
      navigate("/auth");
      return;
    }

    // Navigate to subject explorer with quiz
    navigate(`/explore/${quiz.subject_code.toLowerCase()}`, { 
      state: { selectedTopicId: quiz.topic_id } 
    });
  };

  const getSubjectColor = (subjectCode: string) => {
    switch (subjectCode) {
      case "BST": return "primary";
      case "PVS": return "secondary";  
      case "NV": return "accent";
      default: return "primary";
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return "Easy";
      case 2: return "Medium";
      case 3: return "Hard";
      default: return "Medium";
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return "text-accent";
      case 2: return "text-secondary"; 
      case 3: return "text-destructive";
      default: return "text-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Practice <span className="bg-gradient-hero bg-clip-text text-transparent">Quizzes</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Test your knowledge with interactive quizzes across BST, PVS, and National Values subjects.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2">
                <Brain className="h-5 w-5 animate-spin" />
                <span>Loading quizzes...</span>
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Quizzes Available</h3>
              <p className="text-muted-foreground mb-4">Check back soon for new quizzes!</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Back to Home
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const subjectColor = getSubjectColor(quiz.subject_code);
                return (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge 
                          variant="outline" 
                          className={
                            subjectColor === 'primary' ? 'border-primary text-primary' :
                            subjectColor === 'secondary' ? 'border-secondary text-secondary' :
                            'border-accent text-accent'
                          }
                        >
                          {quiz.subject_code}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={getDifficultyColor(quiz.difficulty_level)}
                        >
                          {getDifficultyLabel(quiz.difficulty_level)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription>{quiz.topic_title}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.question_count} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.total_points} points</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                      </div>

                      <Button 
                        onClick={() => handleTakeQuiz(quiz)} 
                        className="w-full"
                        variant="hero"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Take Quiz
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizzesPage;