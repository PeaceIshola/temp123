import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Clock, CheckCircle, MessageSquare, Send, User, Calendar } from "lucide-react";

interface HomeworkQuestion {
  id: string;
  subject_code: string;
  difficulty_level: string | null;
  question_text: string;
  status: string;
  created_at: string;
  user_id: string;
  teacher_response: string | null;
  teacher_id: string | null;
  responded_at: string | null;
}

const HomeworkQuestionsManager = () => {
  const [questions, setQuestions] = useState<HomeworkQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      console.log('Fetching homework questions...');
      const { data, error } = await supabase
        .from('homework_help_questions')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Fetch result:', { data, error });
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
        description: `Question marked as ${newStatus.replace('_', ' ')}.`,
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

  const submitResponse = async (questionId: string) => {
    if (!response.trim()) {
      toast({
        title: "Missing Response",
        description: "Please write a response before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const { error } = await supabase
        .from('homework_help_questions')
        .update({ 
          teacher_response: response.trim(),
          teacher_id: user?.id,
          responded_at: new Date().toISOString(),
          status: 'answered'
        })
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => 
        prev.map(q => q.id === questionId ? { 
          ...q, 
          teacher_response: response.trim(),
          teacher_id: user?.id || null,
          responded_at: new Date().toISOString(),
          status: 'answered'
        } : q)
      );

      setResponse("");
      setSelectedQuestion(null);

      toast({
        title: "Response Sent",
        description: "Your detailed explanation has been sent to the student.",
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingResponse(false);
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
                          {question.status.charAt(0).toUpperCase() + question.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(question.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Student Question:</h4>
                      <p className="text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                        {question.question_text}
                      </p>
                    </div>

                    {question.teacher_response && (
                      <div className="mb-4 border-t pt-4">
                        <h4 className="font-medium text-sm text-primary mb-2">Your Response:</h4>
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {question.teacher_response}
                          </p>
                        </div>
                        {question.responded_at && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Responded on {new Date(question.responded_at).toLocaleDateString()} at {new Date(question.responded_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}
                    
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
                      
                      {(question.status === 'in_progress' || question.status === 'answered') && (
                        <Dialog open={selectedQuestion === question.id} onOpenChange={(open) => {
                          if (!open) {
                            setSelectedQuestion(null);
                            setResponse("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant={question.teacher_response ? "outline" : "default"}
                              onClick={() => {
                                setSelectedQuestion(question.id);
                                setResponse(question.teacher_response || "");
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {question.teacher_response ? "Edit Response" : "Write Response"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Provide Step-by-Step Explanation</DialogTitle>
                              <DialogDescription>
                                Write a detailed explanation to help the student understand the concept.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-muted/30 p-3 rounded-lg">
                                <h4 className="font-medium text-sm mb-2">Student's Question:</h4>
                                <p className="text-sm">{question.question_text}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Your Detailed Explanation:</label>
                                <Textarea
                                  placeholder="Provide a step-by-step explanation that helps the student understand the concept. Be clear and detailed in your response..."
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  rows={8}
                                  className="resize-none"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedQuestion(null);
                                    setResponse("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => submitResponse(question.id)}
                                  disabled={isSubmittingResponse || !response.trim()}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  {isSubmittingResponse ? "Sending..." : "Send Response"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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