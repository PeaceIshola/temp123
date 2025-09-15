import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight,
  Upload,
  Camera,
  Type,
  Search
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HomeworkHelp = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const { toast } = useToast();

  const subjects = [
    { code: "BST", name: "Business Studies" },
    { code: "PVS", name: "Physical Science" },
    { code: "NV", name: "Natural Science" }
  ];

  const helpMethods = [
    {
      icon: Type,
      title: "Type Your Question",
      description: "Describe your homework problem in detail",
      action: "type"
    },
    {
      icon: Camera,
      title: "Upload Photo",
      description: "Take a picture of your homework question",
      action: "photo"
    },
    {
      icon: Upload,
      title: "Upload Document",
      description: "Upload your homework document or worksheet",
      action: "document"
    }
  ];

  const exampleQuestions = [
    {
      subject: "BST",
      question: "How do I calculate break-even point for a business?",
      difficulty: "Medium"
    },
    {
      subject: "PVS",
      question: "What's the difference between velocity and acceleration?",
      difficulty: "Easy"
    },
    {
      subject: "NV",
      question: "How does photosynthesis work in plants?",
      difficulty: "Medium"
    }
  ];

  const handleSubmitQuestion = () => {
    if (!selectedSubject || !questionText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a subject and enter your question.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Question Submitted",
      description: "We'll provide a detailed step-by-step explanation shortly.",
    });

    // Reset form
    setQuestionText("");
    setSelectedSubject("");
    setDifficultyLevel("");
  };

  const handleMethodClick = (action: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `${action === 'photo' ? 'Photo upload' : action === 'document' ? 'Document upload' : 'Advanced input'} will be available soon.`,
    });
  };

  const getSubjectColor = (code: string) => {
    switch (code) {
      case "BST": return "bg-primary/10 text-primary border-primary/20";
      case "PVS": return "bg-secondary/10 text-secondary border-secondary/20";
      case "NV": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold">
              Get <span className="bg-gradient-hero bg-clip-text text-transparent">Step-by-Step</span> Homework Help
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Submit your homework questions and receive detailed, step-by-step explanations to help you understand and learn.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Question Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Submit Your Homework Question
                  </CardTitle>
                  <CardDescription>
                    Choose how you'd like to submit your homework question for detailed help.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Help Methods */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    {helpMethods.map((method) => (
                      <Card 
                        key={method.action}
                        className="cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => handleMethodClick(method.action)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                            <method.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-medium text-sm mb-1">{method.title}</h3>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Question Form */}
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Subject</label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose subject" />
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
                      <div>
                        <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Question</label>
                      <Textarea
                        placeholder="Describe your homework problem in detail. Include any specific parts you're struggling with..."
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button 
                      onClick={handleSubmitQuestion}
                      className="w-full"
                      size="lg"
                    >
                      Get Step-by-Step Help
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Example Questions */}
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-secondary" />
                    Example Questions
                  </CardTitle>
                  <CardDescription>
                    See how other students ask for help
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exampleQuestions.map((example, index) => (
                    <div key={index} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge className={getSubjectColor(example.subject)}>
                          {example.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {example.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{example.question}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">Submit Question</p>
                        <p className="text-xs text-muted-foreground">Choose your subject and describe your problem</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">Get Explanation</p>
                        <p className="text-xs text-muted-foreground">Receive detailed step-by-step breakdown</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">Learn & Practice</p>
                        <p className="text-xs text-muted-foreground">Understand the concept and apply it</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomeworkHelp;