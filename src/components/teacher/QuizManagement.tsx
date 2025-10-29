import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Brain, Trash2, Edit, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Quiz {
  topic_id: string;
  topic_title: string;
  question_count: number;
  total_points: number;
  content_title: string;
  content_id: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

const QuizManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState("");
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);

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

  const openEditDialog = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditQuizTitle(quiz.content_title);
    
    // Fetch questions for this quiz
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', quiz.topic_id)
      .order('created_at');
    
    if (questions) {
      // Cast options from Json to string[]
      const formattedQuestions = questions.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : []
      })) as Question[];
      setEditQuestions(formattedQuestions);
    }
    
    setEditDialogOpen(true);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...editQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditQuestions(updated);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...editQuestions];
    const options = [...updated[questionIndex].options];
    options[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options };
    setEditQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setEditQuestions(editQuestions.filter((_, i) => i !== index));
  };

  const saveQuizEdits = async () => {
    if (!editingQuiz) return;
    
    setLoading(true);
    try {
      // Update content title
      const { error: contentError } = await supabase
        .from('content')
        .update({ title: editQuizTitle })
        .eq('id', editingQuiz.content_id);

      if (contentError) throw contentError;

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('topic_id', editingQuiz.topic_id);

      if (deleteError) throw deleteError;

      // Insert updated questions
      const { error: insertError } = await supabase
        .from('questions')
        .insert(editQuestions.map(q => ({
          topic_id: editingQuiz.topic_id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          points: q.points,
          difficulty_level: 1,
          created_by: user?.id
        })));

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Quiz updated successfully",
      });

      setEditDialogOpen(false);
      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(quiz)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Quiz Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Update quiz details and questions
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Quiz Title</Label>
                <Input
                  value={editQuizTitle}
                  onChange={(e) => setEditQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Questions ({editQuestions.length})</Label>
                  <Badge variant="default">
                    Total: {editQuestions.reduce((sum, q) => sum + q.points, 0)} pts
                  </Badge>
                </div>

                {editQuestions.map((question, qIndex) => (
                  <Card key={qIndex}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label>Question {qIndex + 1}</Label>
                            <Textarea
                              value={question.question_text}
                              onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                              placeholder="Question text"
                              className="min-h-[80px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={question.question_type}
                                onValueChange={(value) => updateQuestion(qIndex, 'question_type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                                  <SelectItem value="short_answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input
                                type="number"
                                min="1"
                                value={question.points}
                                onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          {(question.question_type === "multiple_choice" || question.question_type === "true_false") && (
                            <div className="space-y-2">
                              <Label>Options</Label>
                              {question.question_type === "true_false" ? (
                                <div className="space-y-2">
                                  {["True", "False"].map((opt, i) => (
                                    <Input key={i} value={opt} disabled />
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {question.options.map((opt, optIndex) => (
                                    <Input
                                      key={optIndex}
                                      value={opt}
                                      onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Correct Answer</Label>
                            <Input
                              value={question.correct_answer}
                              onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                              placeholder="Correct answer"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Explanation (Optional)</Label>
                            <Textarea
                              value={question.explanation}
                              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                              placeholder="Explain the correct answer"
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestion(qIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuizEdits} disabled={loading || editQuestions.length === 0}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuizManagement;