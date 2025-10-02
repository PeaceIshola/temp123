import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, Clock, Trophy, CheckCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  points: number;
  difficulty_level: number;
}

interface QuizData {
  id: string;
  title: string;
  topic_title: string;
  subject_code: string;
  questions: Question[];
}

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, user]);

  const fetchQuiz = async () => {
    try {
      // Get quiz content
      const { data: content, error: contentError } = await supabase
        .from('content')
        .select(`
          id,
          title,
          topic_id,
          topics!inner(
            title,
            sub_subjects!inner(
              subjects!inner(code)
            )
          )
        `)
        .eq('id', quizId)
        .eq('content_type', 'experiment')
        .eq('is_published', true)
        .single();

      if (contentError) throw contentError;

      // Check if user already completed this quiz
      const { data: existingAttempt } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('topic_id', content.topic_id)
        .maybeSingle();

      if (existingAttempt) {
        setAlreadyCompleted(true);
        setLoading(false);
        return;
      }

      // Get quiz questions using the function
      const { data: questions, error: questionsError } = await supabase.rpc('get_quiz_questions', {
        p_topic_id: content.topic_id
      });

      if (questionsError) throw questionsError;

      setQuiz({
        id: content.id,
        title: content.title,
        topic_title: content.topics.title,
        subject_code: content.topics.sub_subjects.subjects.code,
        questions: (questions || []).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        }))
      });
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      });
      navigate("/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Quiz",
        description: `Please answer all questions before submitting. ${unansweredQuestions.length} questions remain.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the topic_id from the quiz data
      const topicId = quiz.questions[0]?.id; // We'll need to get topic_id properly
      
      // For now, let's get the topic_id from the content we fetched
      const { data: contentData } = await supabase
        .from('content')
        .select('topic_id')
        .eq('id', quiz.id)
        .single();
      
      const { data: result, error } = await supabase.rpc('submit_quiz_attempt', {
        p_topic_id: contentData?.topic_id,
        p_answers: answers
      });

      if (error) throw error;

      // Type assertion for the result
      const typedResult = result as { score: number; total_questions: number };
      setResults(typedResult);
      setIsCompleted(true);
      
      toast({
        title: "Quiz Completed!",
        description: `You scored ${typedResult.score} out of ${typedResult.total_questions} questions.`,
      });
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <div className="text-center">
              <Brain className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p>Loading quiz...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Quiz Already Completed</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  You have already completed this quiz. Each quiz can only be taken once.
                </p>
                <Button onClick={() => navigate("/quizzes")}>
                  Back to Quizzes
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <div className="text-center">
              <p>Quiz not found.</p>
              <Button onClick={() => navigate("/quizzes")} className="mt-4">
                Back to Quizzes
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="text-4xl font-bold text-primary">
                  {results.score}/{results.total_questions}
                </div>
                <p className="text-lg">
                  You scored {Math.round((results.score / results.total_questions) * 100)}%
                </p>
                <Button onClick={() => navigate("/quizzes")}>
                  Back to Quizzes
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/quizzes")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Button>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                <p className="text-muted-foreground">{quiz.topic_title}</p>
              </div>
              <Badge variant="outline">{quiz.subject_code}</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Question {currentQuestionIndex + 1}
                <Badge variant="outline" className="ml-auto">
                  {currentQuestion?.points} {currentQuestion?.points === 1 ? 'point' : 'points'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{currentQuestion?.question_text}</p>
              
              {currentQuestion?.question_type === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="text-primary"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion?.question_type === 'true_false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="text-primary"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {(currentQuestion?.question_type === 'fill_blank' || currentQuestion?.question_type === 'short_answer') && (
                <input
                  type="text"
                  placeholder="Enter your answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-3 border rounded-md"
                />
              )}

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TakeQuiz;