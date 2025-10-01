import { useState, useRef } from "react";
import homeworkHelpImage from "@/assets/homework-help-hero.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  Search,
  MessageSquare
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudentHomeworkTracker from "@/components/student/StudentHomeworkTracker";
import StudentHomeworkQuestionForm from "@/components/student/StudentHomeworkQuestionForm";

const HomeworkHelp = () => {
  const { user } = useAuth();
  const trackerRef = useRef<{ refreshQuestions: () => void }>(null);

  const handleQuestionSubmitted = () => {
    // Scroll to tracker section
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const subjects = [
    { code: "BST", name: "Basic Science & Technology", color: "#3B82F6" },
    { code: "PVS", name: "Prevocational Studies", color: "#10B981" },
    { code: "NV", name: "National Values Education", color: "#F59E0B" }
  ];

  const exampleQuestions = [
    {
      subject: "BST",
      question: "I'm confused about how computers process data. Can you explain the basic components?",
      difficulty: "Medium"
    },
    {
      subject: "PVS",
      question: "What's the difference between farming and agriculture? I need help with my assignment.",
      difficulty: "Easy"
    },
    {
      subject: "NV",
      question: "How do citizens participate in democracy? I don't understand the different ways.",
      difficulty: "Medium"
    }
  ];

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
              Get <span className="bg-gradient-hero bg-clip-text text-transparent">Step-by-Step</span> Solutions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask your homework questions and receive detailed explanations from teachers.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {user ? (
                <StudentHomeworkQuestionForm onQuestionSubmitted={handleQuestionSubmitted} />
              ) : (
                <Card className="bg-gradient-card border shadow-card">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">Please sign in to ask homework questions.</p>
                    <a href="/auth" className="text-primary font-medium underline">Sign In</a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Homework Help Visual */}
              <Card className="bg-gradient-card border shadow-card overflow-hidden">
                <div className="relative">
                  <img 
                    src={homeworkHelpImage} 
                    alt="Students collaborating on homework and learning together"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg mb-1">Get Help with Your Studies</h3>
                    <p className="text-white/90 text-sm">Join thousands of students getting step-by-step solutions</p>
                  </div>
                </div>
              </Card>
              {/* Example Questions */}
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-secondary" />
                    Example Questions
                  </CardTitle>
                  <CardDescription>
                    See how other students ask for help in the forum
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
                        <p className="text-sm font-medium">Ask in Forum</p>
                        <p className="text-xs text-muted-foreground">Post your question in the Ask & Answer Forum</p>
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
                        <p className="text-sm font-medium">View Here</p>
                        <p className="text-xs text-muted-foreground">Check your solutions in this section</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Student's Previous Questions and Responses */}
          {user && (
            <div className="mt-12">
              <StudentHomeworkTracker />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomeworkHelp;