import { useState } from "react";
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

const HomeworkHelp = () => {
  const { user } = useAuth();

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
              View Your <span className="bg-gradient-hero bg-clip-text text-transparent">Step-by-Step</span> Solutions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Check your homework questions and receive detailed explanations from teachers.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-800">
                <MessageSquare className="h-4 w-4" />
                <p className="text-sm">
                  Want to ask a new question? Use our <a href="/forum" className="font-medium underline">Ask & Answer Forum</a>
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Your Homework Solutions
                  </CardTitle>
                  <CardDescription>
                    Track your submitted questions and view step-by-step solutions provided by teachers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Please sign in to view your homework solutions.</p>
                      <a href="/auth" className="text-primary font-medium underline">Sign In</a>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Your homework questions and solutions will appear below.</p>
                    </div>
                  )}
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