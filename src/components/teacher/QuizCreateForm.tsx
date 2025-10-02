import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubSubject {
  id: string;
  name: string;
  subject_id: string;
}

interface Topic {
  id: string;
  title: string;
  sub_subject_id: string;
}

interface Question {
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

const QuizCreateForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubSubject, setSelectedSubSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);

  // Quiz data
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    question_type: "multiple_choice",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    points: 1
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubSubjects(selectedSubject);
      setSelectedSubSubject("");
      setSelectedTopic("");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubSubject) {
      fetchCustomTopics(selectedSubSubject);
      setSelectedTopic("");
    }
  }, [selectedSubSubject]);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .in('code', ['BST', 'PVS', 'NV'])
      .order('name');

    setSubjects(data || []);
  };

  const fetchSubSubjects = async (subjectId: string) => {
    const { data } = await supabase
      .from('sub_subjects')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');

    setSubSubjects(data || []);
  };

  const fetchCustomTopics = async (subSubjectId: string) => {
    // Fetch unique custom topics from content metadata
    const { data } = await supabase
      .from('content')
      .select('metadata')
      .eq('metadata->>subSubjectId', subSubjectId)
      .not('metadata->>topic', 'is', null);

    if (data) {
      const topics = data
        .map(item => {
          const metadata = item.metadata as Record<string, any>;
          return metadata?.topic as string;
        })
        .filter((topic, index, self) => topic && self.indexOf(topic) === index)
        .sort();
      setCustomTopics(topics);
    } else {
      setCustomTopics([]);
    }
  };


  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""]
    });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions
      });
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text || !currentQuestion.correct_answer) {
      toast({
        title: "Error",
        description: "Please fill in question text and correct answer",
        variant: "destructive",
      });
      return;
    }

    // Validate that correct answer exists in options for multiple choice
    if (currentQuestion.question_type === "multiple_choice" && 
        !currentQuestion.options.includes(currentQuestion.correct_answer)) {
      toast({
        title: "Error",
        description: "Correct answer must be one of the options",
        variant: "destructive",
      });
      return;
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      points: 1
    });

    toast({
      title: "Question Added",
      description: "Question added to quiz successfully",
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTopic || !quizTitle || questions.length === 0 || !selectedSubSubject) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Creating quiz with', questions.length, 'questions for topic:', selectedTopic);
      
      // Find or create the topic
      let topicId: string;
      const { data: existingTopic } = await supabase
        .from('topics')
        .select('id')
        .eq('sub_subject_id', selectedSubSubject)
        .eq('title', selectedTopic)
        .single();

      if (existingTopic) {
        topicId = existingTopic.id;
        console.log('Using existing topic:', topicId);
      } else {
        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert({
            sub_subject_id: selectedSubSubject,
            title: selectedTopic,
            description: `Quiz topic: ${selectedTopic}`
          })
          .select('id')
          .single();

        if (topicError) throw topicError;
        topicId = newTopic.id;
        console.log('Created new topic:', topicId);
      }

      // Create the content entry for the quiz
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          topic_id: topicId,
          title: quizTitle,
          content: `Quiz with ${questions.length} questions`,
          content_type: "experiment",
          created_by: user?.id,
          is_published: true
        })
        .select()
        .single();

      if (contentError) throw contentError;
      console.log('Content created:', contentData);

      // Then create all questions
      const questionsToInsert = questions.map(q => ({
        topic_id: topicId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options.filter(opt => opt.trim() !== ""),
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        difficulty_level: 1,
        created_by: user?.id
      }));

      console.log('Inserting questions:', questionsToInsert);

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;
      console.log('Quiz created successfully with all questions');

      toast({
        title: "Success!",
        description: "Quiz created successfully with all questions",
      });

      // Reset form
      setQuizTitle("");
      setQuestions([]);
      setSelectedSubject("");
      setSelectedSubSubject("");
      setSelectedTopic("");
    } catch (error: any) {
      console.error('Quiz creation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
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
          Create Quiz/Exercise
        </CardTitle>
        <CardDescription>
          Create interactive quizzes with multiple choice, true/false, and fill-in-the-blank questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subsubject">Area</Label>
              <Select 
                value={selectedSubSubject} 
                onValueChange={setSelectedSubSubject}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {subSubjects.map((subSubject) => (
                    <SelectItem key={subSubject.id} value={subSubject.id}>
                      {subSubject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select 
                value={selectedTopic} 
                onValueChange={setSelectedTopic}
                disabled={!selectedSubSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {customTopics.map((topic, index) => (
                    <SelectItem key={index} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
            />
          </div>

          {/* Current Questions */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Questions Added ({questions.length})</Label>
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-primary">Total Points:</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {questions.reduce((sum, q) => sum + q.points, 0)} pts
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{q.question_text}</p>
                      <Badge variant="outline" className="mr-2">
                        {q.question_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {q.points} {q.points === 1 ? 'point' : 'points'}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Builder */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Add Question</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select 
                  value={currentQuestion.question_type} 
                  onValueChange={(value) => setCurrentQuestion({...currentQuestion, question_type: value})}
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
                  max="10"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                placeholder="Enter your question"
                className="min-h-[100px]"
              />
            </div>

            {/* Options for multiple choice and true/false */}
            {(currentQuestion.question_type === "multiple_choice" || currentQuestion.question_type === "true_false") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  {currentQuestion.question_type === "multiple_choice" && (
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {currentQuestion.question_type === "true_false" ? 
                    ["True", "False"].map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          disabled
                          className="flex-1"
                        />
                      </div>
                    )) :
                    currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        {currentQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              {currentQuestion.question_type === "multiple_choice" ? (
                <Select 
                  value={currentQuestion.correct_answer} 
                  onValueChange={(value) => setCurrentQuestion({...currentQuestion, correct_answer: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentQuestion.options.filter(opt => opt.trim() !== "").map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : currentQuestion.question_type === "true_false" ? (
                <Select 
                  value={currentQuestion.correct_answer} 
                  onValueChange={(value) => setCurrentQuestion({...currentQuestion, correct_answer: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={currentQuestion.correct_answer}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                  placeholder="Enter the correct answer"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                placeholder="Explain why this is the correct answer"
              />
            </div>

            <Button type="button" onClick={addQuestion} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Question to Quiz
            </Button>
          </div>

          <Button type="submit" disabled={loading || questions.length === 0} className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            {loading ? "Creating Quiz..." : "Create Quiz"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuizCreateForm;