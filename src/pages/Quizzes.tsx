import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, BookOpen, Clock, Trophy, Play, CheckCircle, AlertCircle } from "lucide-react";
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
  completed?: boolean;
}

const QuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  // Refetch quizzes when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Page became visible, refreshing quiz list...');
        fetchQuizzes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      if (user) {
        console.log('Window focused, refreshing quiz list...');
        fetchQuizzes();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchQuizzes);
    };
  }, [user]);

  const fetchQuizzes = async () => {
    console.log('Fetching quizzes...');
    try {
      // Get user's completed quiz attempts if logged in
      if (user) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('topic_id')
          .eq('user_id', user.id);
        
        if (attemptsError) {
          console.error('Error fetching quiz attempts:', attemptsError);
        }
        
        if (attempts) {
          console.log('User completed quiz attempts:', attempts);
          setCompletedQuizzes(new Set(attempts.map(a => a.topic_id)));
        }
      }

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

      console.log('Fetched quiz content:', quizContent);

      if (quizContent) {
        console.log('Processing', quizContent.length, 'quiz content items');
        const quizData = await Promise.all(
          quizContent.map(async (content) => {
            console.log('Processing content:', content);
            
            // Use the secure function to get quiz metadata
            const { data: metadata, error: metadataError } = await supabase.rpc('get_quiz_metadata', {
              p_topic_id: content.topic_id
            });

            if (metadataError) {
              console.error('Error fetching quiz metadata for topic', content.topic_id, ':', metadataError);
            }
            console.log('Metadata for', content.title, ':', metadata);

            return {
              id: content.id,
              title: content.title,
              topic_id: content.topic_id,
              topic_title: content.topics.title,
              subject_code: content.topics.sub_subjects.subjects.code,
              question_count: Number(metadata?.[0]?.question_count || 0),
              total_points: Number(metadata?.[0]?.total_points || 0),
              difficulty_level: content.topics.difficulty_level || 1,
              created_at: content.created_at,
              completed: completedQuizzes.has(content.topic_id)
            };
          })
        );

        console.log('Processed quiz data:', quizData);
        console.log('Quizzes marked as completed:', quizData.filter(q => q.completed).map(q => q.title));
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

    if (quiz.completed) {
      toast({
        title: "Quiz Already Completed",
        description: "You have already completed this quiz.",
      });
      return;
    }

    // Navigate to dedicated quiz-taking page
    navigate(`/quiz/${quiz.id}`);
  };

  const getSubjectColor = (subjectCode: string) => {
    switch (subjectCode) {
      case "BST": return "primary";
      case "PVS": return "secondary";  
      case "NV": return "accent";
      default: return "primary";
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
                  <Card key={quiz.id} className={`hover:shadow-lg transition-shadow ${quiz.completed ? 'opacity-75' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {quiz.completed ? (
                          <Badge variant="default" className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Single Attempt
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-2">{quiz.title}</CardTitle>
                      <CardDescription>{quiz.topic_title}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{quiz.question_count} questions</span>
                          </div>
                          <div className="flex items-center gap-2 font-semibold text-primary">
                            <Trophy className="h-5 w-5" />
                            <span className="text-lg">{quiz.total_points} pts</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                      </div>

                      {quiz.completed ? (
                        <div className="w-full bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-700 dark:text-green-300">Completed</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleTakeQuiz(quiz)} 
                          className="w-full"
                          variant="hero"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Take Quiz
                        </Button>
                      )}
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