import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePopularQuestions } from "@/hooks/usePopularQuestions";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  CheckCircle, 
  BookOpen, 
  Users,
  Clock,
  Star
} from "lucide-react";

const HomeworkSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { questions: popularQuestions, loading: questionsLoading } = usePopularQuestions();

  const handleAskQuestion = () => {
    if (user) {
      toast({
        title: "Coming Soon!",
        description: "Question submission feature will be available soon.",
      });
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to ask questions.",
      });
      navigate("/auth");
    }
  };

  const handleBrowseSolutions = () => {
    if (user) {
      navigate("/solution-bank");
    } else {
      navigate("/auth");
    }
  };

  const handleViewAllTools = () => {
    if (user) {
      toast({
        title: "Coming Soon!",
        description: "Additional homework tools will be available soon.",
      });
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: HelpCircle,
      title: "Step-by-Step Solutions",
      description: "Get detailed explanations for common homework questions across all subjects"
    },
    {
      icon: Users,
      title: "Ask & Answer Forum",
      description: "Connect with peers and get help with difficult questions from the community"
    },
    {
      icon: BookOpen,
      title: "Study Resources",
      description: "Access revision notes, worksheets, and downloadable materials for offline study"
    },
    {
      icon: Clock,
      title: "Quick Help",
      description: "Get instant answers to frequently asked questions and common problems"
    }
  ];

  const getSubjectColor = (subjectCode: string) => {
    switch (subjectCode) {
      case "BST": return "primary";
      case "PVS": return "secondary";
      case "NV": return "accent";
      default: return "primary";
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

  return (
    <section id="homework" className="py-20 bg-gradient-bg">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Get <span className="bg-gradient-hero bg-clip-text text-transparent">Homework Help</span> Instantly
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Never struggle with homework again. Our comprehensive help system provides solutions, guidance, and peer support.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-gradient-card border shadow-card">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <Button variant="hero" size="lg" className="w-full" onClick={handleAskQuestion}>
                Ask a Question
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={handleBrowseSolutions}>
                Browse Solution Bank
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-card rounded-lg p-6 border shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-secondary" />
                Popular Questions This Week
              </h3>
              <div className="space-y-4">
                {questionsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading popular questions...</p>
                  </div>
                ) : popularQuestions.length > 0 ? (
                  popularQuestions.map((q) => {
                    const color = getSubjectColor(q.subject_code);
                    return (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          color === 'primary' ? 'bg-primary/10 text-primary' :
                          color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                          'bg-accent/10 text-accent'
                        }`}>
                          {q.subject_code}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-xs ${getDifficultyColor(q.difficulty_level)}`}>{q.difficulty_level}</p>
                            <span className="text-xs text-muted-foreground">• {q.ask_count} times asked</span>
                          </div>
                        </div>
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No popular questions this week yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" onClick={handleViewAllTools}>
            View All Homework Help Tools
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeworkSection;