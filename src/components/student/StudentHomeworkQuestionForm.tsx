import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PenSquare, Send } from "lucide-react";

interface StudentHomeworkQuestionFormProps {
  onQuestionSubmitted?: () => void;
}

const StudentHomeworkQuestionForm = ({ onQuestionSubmitted }: StudentHomeworkQuestionFormProps) => {
  const [subjectCode, setSubjectCode] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const subjects = [
    { code: "BST", name: "Basic Science & Technology" },
    { code: "PVS", name: "Prevocational Studies" },
    { code: "NV", name: "National Values Education" }
  ];

  const difficultyLevels = ["Easy", "Medium", "Hard"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a question.",
        variant: "destructive"
      });
      return;
    }

    if (!subjectCode || !questionText.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a subject and enter your question.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('homework_help_questions')
        .insert({
          user_id: user.id,
          subject_code: subjectCode,
          difficulty_level: difficultyLevel || null,
          question_text: questionText.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Question submitted!",
        description: "A teacher will review your question and provide a detailed response soon.",
      });

      // Reset form
      setSubjectCode("");
      setDifficultyLevel("");
      setQuestionText("");

      // Notify parent component
      if (onQuestionSubmitted) {
        onQuestionSubmitted();
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error",
        description: "Failed to submit your question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-card border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenSquare className="h-5 w-5 text-primary" />
          Ask a Homework Question
        </CardTitle>
        <CardDescription>
          Submit your homework question and receive a detailed step-by-step explanation from a teacher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={subjectCode} onValueChange={setSubjectCode}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.code} value={subject.code}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level (Optional)</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Your Question *</Label>
            <Textarea
              id="question"
              placeholder="Describe your homework question in detail. The more information you provide, the better the teacher can help you..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Include what you've tried so far and where you're getting stuck.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !subjectCode || !questionText.trim()}
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Question
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentHomeworkQuestionForm;
