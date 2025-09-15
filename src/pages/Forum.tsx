import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ForumSecurityInfo } from "@/components/ForumSecurityInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MessageSquare, 
  Plus, 
  User, 
  Clock, 
  CheckCircle, 
  MessageCircle,
  ArrowLeft,
  Reply,
  ChevronDown,
  ChevronRight,
  Send
} from "lucide-react";

interface ForumQuestion {
  id: string;
  title: string;
  question_text: string;
  subject_code: string;
  difficulty_level: string;
  is_answered: boolean;
  created_at: string;
  tags: string[];
  posted_by: string;
  anonymous_id: string;
  is_own_question: boolean;
  answers?: ForumAnswer[];
}

interface ForumAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_accepted: boolean;
  votes: number;
  created_at: string;
  posted_by: string;
  anonymous_id: string;
  is_own_answer: boolean;
  replies?: ForumAnswer[];
}

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ questionId?: string; answerId?: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    question_text: "",
    subject_code: "",
    difficulty_level: "Medium"
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchQuestions();
  }, [user, navigate]);

  const fetchQuestions = async () => {
    try {
      // Use the secure function to get anonymized questions
      const { data: questionsData, error: questionsError } = await supabase
        .rpc('get_public_forum_questions');

      if (questionsError) throw questionsError;

      // Fetch answers for each question using the secure function
      const questionsWithAnswers = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answersData, error: answersError } = await supabase
            .rpc('get_public_forum_answers', { p_question_id: question.id });

          if (answersError) {
            console.error('Error fetching answers:', answersError);
            return { ...question, answers: [] };
          }

          return { ...question, answers: answersData || [] };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load forum questions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_questions')
        .insert({
          ...formData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your question has been posted to the forum."
      });

      setFormData({
        title: "",
        question_text: "",
        subject_code: "",
        difficulty_level: "Medium"
      });
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error posting question:', error);
      toast({
        title: "Error",
        description: "Failed to post your question. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('forum_answers')
        .insert({
          question_id: replyingTo?.questionId,
          user_id: user.id,
          answer_text: replyText.trim()
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your reply has been posted."
      });

      setReplyText("");
      setReplyingTo(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post your reply. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getSubjectColor = (subjectCode: string) => {
    switch (subjectCode) {
      case "BST": return "bg-primary/10 text-primary";
      case "PVS": return "bg-secondary/10 text-secondary";
      case "NV": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-accent";
      case "Medium": return "text-secondary";
      case "Hard": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  Question Forum
                </h1>
                <p className="text-muted-foreground">Ask questions and help your peers</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ask Question
            </Button>
          </div>

          <ForumSecurityInfo />

          {showForm && (
            <Card className="bg-gradient-card border shadow-card">
              <CardHeader>
                <CardTitle>Ask a New Question</CardTitle>
                <CardDescription>
                  Share your question with the community and get help from peers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Question title..."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                      value={formData.subject_code} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject_code: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BST">Business Studies</SelectItem>
                        <SelectItem value="PVS">Physical Sciences</SelectItem>
                        <SelectItem value="NV">Natural Sciences</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={formData.difficulty_level} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Textarea
                      placeholder="Describe your question in detail..."
                      value={formData.question_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Post Question</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <Card className="bg-gradient-card border shadow-card">
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No questions posted yet. Be the first to ask!</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className="bg-gradient-card border shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSubjectColor(question.subject_code)}>
                            {question.subject_code}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                          {question.is_answered && (
                            <Badge className="bg-accent/10 text-accent">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Answered
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{question.title}</h3>
                          <p className="text-muted-foreground">{question.question_text}</p>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {question.is_own_question ? "You" : question.anonymous_id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(question.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {question.answers?.length || 0} replies
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setReplyingTo({ questionId: question.id })}
                              className="flex items-center gap-1"
                            >
                              <Reply className="h-4 w-4" />
                              Reply
                            </Button>
                            {question.answers && question.answers.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(question.id)}
                                className="flex items-center gap-1"
                              >
                                {expandedQuestions.has(question.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {expandedQuestions.has(question.id) ? 'Hide' : 'Show'} Replies
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingTo?.questionId === question.id && (
                          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                            <form onSubmit={handleReply} className="space-y-3">
                              <Textarea
                                placeholder="Write your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                required
                              />
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" className="flex items-center gap-1">
                                  <Send className="h-4 w-4" />
                                  Post Reply
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setReplyingTo(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Answers/Replies */}
                        {expandedQuestions.has(question.id) && question.answers && question.answers.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <Separator />
                            <h4 className="font-medium text-foreground">Replies ({question.answers.length})</h4>
                            <div className="space-y-3">
                              {question.answers.map((answer) => (
                                <div key={answer.id} className="p-4 border rounded-lg bg-muted/20">
                                  <div className="space-y-2">
                                    <p className="text-foreground">{answer.answer_text}</p>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                      <div className="flex items-center gap-3">
                                         <span className="flex items-center gap-1">
                                           <User className="h-3 w-3" />
                                           {answer.is_own_answer ? "You" : answer.anonymous_id}
                                         </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {new Date(answer.created_at).toLocaleDateString()}
                                        </span>
                                        {answer.is_accepted && (
                                          <Badge className="bg-accent/10 text-accent">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Accepted
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">👍 {answer.votes}</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => setReplyingTo({ questionId: question.id, answerId: answer.id })}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Reply
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Nested Reply Form */}
                                    {replyingTo?.answerId === answer.id && (
                                      <div className="mt-3 p-3 border rounded bg-background/50">
                                        <form onSubmit={handleReply} className="space-y-3">
                                          <Textarea
                                            placeholder="Reply to this answer..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            rows={2}
                                            required
                                          />
                                          <div className="flex gap-2">
                                            <Button type="submit" size="sm" className="flex items-center gap-1">
                                              <Send className="h-4 w-4" />
                                              Reply
                                            </Button>
                                            <Button 
                                              type="button" 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setReplyingTo(null)}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </form>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Forum;