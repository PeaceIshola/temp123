import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Clock, CheckCircle, User, Calendar, RefreshCw } from "lucide-react";

interface StudentHomeworkQuestion {
  id: string;
  subject_code: string;
  difficulty_level: string | null;
  question_text: string;
  status: string;
  created_at: string;
  teacher_response: string | null;
  responded_at: string | null;
}

const StudentHomeworkTracker = () => {
  const [questions, setQuestions] = useState<StudentHomeworkQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const subjects = [
    { code: "BST", name: "Basic Science & Technology" },
    { code: "PVS", name: "Prevocational Studies" },
    { code: "NV", name: "National Values Education" }
  ];

  const getSubjectName = (code: string) => {
    return subjects.find(s => s.code === code)?.name || code;
  };

  const getSubjectColor = (code: string) => {
    switch (code) {
      case "BST": return "bg-primary/10 text-primary border-primary/20";
      case "PVS": return "bg-secondary/10 text-secondary border-secondary/20";
      case "NV": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "answered": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "answered": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <User className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyQuestions();
      
      // Set up real-time subscription for homework question updates
      const channel = supabase
        .channel('homework_help_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'homework_help_questions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // Update the specific question with new data
            setQuestions(prev => 
              prev.map(q => q.id === payload.new.id ? payload.new as StudentHomeworkQuestion : q)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMyQuestions = async () => {
    try {
      console.log('Fetching student questions for user:', user?.id);
      const { data, error } = await supabase
        .from('homework_help_questions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Student questions result:', { data, error });
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching student questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your homework questions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Please sign in to view your homework questions.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your questions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                My Homework Questions
              </CardTitle>
              <CardDescription>
                Track the status of your submitted homework questions and view teacher responses.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMyQuestions}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't submitted any homework questions yet.</p>
              <p className="text-sm mt-2">Visit the <a href="/homework-help" className="text-primary underline">Homework Help</a> page to ask your first question.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getSubjectColor(question.subject_code)}>
                          {getSubjectName(question.subject_code)}
                        </Badge>
                        {question.difficulty_level && (
                          <Badge variant="outline">
                            {question.difficulty_level}
                          </Badge>
                        )}
                        <Badge className={getStatusColor(question.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(question.status)}
                            {question.status.charAt(0).toUpperCase() + question.status.slice(1).replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(question.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Your Question:</h4>
                      <p className="text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                        {question.question_text}
                      </p>
                    </div>
                    
                    {question.teacher_response && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-primary">Teacher's Response:</h4>
                          {question.responded_at && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(question.responded_at).toLocaleDateString()} at {new Date(question.responded_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {question.teacher_response}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {question.status === 'in_progress' && !question.teacher_response && (
                      <div className="border-t pt-4">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <p className="text-blue-800 text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            A teacher is currently working on your question. You'll receive a detailed response soon!
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentHomeworkTracker;