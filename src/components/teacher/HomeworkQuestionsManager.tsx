import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Clock, CheckCircle, MessageSquare } from "lucide-react";

interface HomeworkQuestion {
  id: string;
  subject_code: string;
  difficulty_level: string | null;
  question_text: string;
  status: string;
  created_at: string;
  user_id: string;
}

const HomeworkQuestionsManager = () => {
  const [questions, setQuestions] = useState<HomeworkQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  const subjects = [
    { code: "BST", name: "Basic Science & Technology", color: "#3B82F6" },
    { code: "PVS", name: "Prevocational Studies", color: "#10B981" },
    { code: "NV", name: "National Values Education", color: "#F59E0B" }
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

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('homework_help_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch homework questions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionStatus = async (questionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('homework_help_questions')
        .update({ status: newStatus })
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => 
        prev.map(q => q.id === questionId ? { ...q, status: newStatus } : q)
      );

      toast({
        title: "Status Updated",
        description: `Question marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading homework questions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Student Homework Questions
          </CardTitle>
          <CardDescription>
            Review and respond to student questions requiring step-by-step explanations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No homework questions submitted yet.</p>
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
                          {question.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(question.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-foreground mb-4 leading-relaxed">
                      {question.question_text}
                    </p>
                    
                    <div className="flex gap-2">
                      {question.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateQuestionStatus(question.id, 'in_progress')}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Start Working
                        </Button>
                      )}
                      {question.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateQuestionStatus(question.id, 'answered')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Answered
                        </Button>
                      )}
                      {question.status === 'answered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuestionStatus(question.id, 'pending')}
                        >
                          Reset to Pending
                        </Button>
                      )}
                    </div>
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

export default HomeworkQuestionsManager;