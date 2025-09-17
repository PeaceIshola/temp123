import { Button } from "@/components/ui/button";
import homeworkHelpImage from "@/assets/homework-help-hero.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  BookOpen, 
  Users,
  Clock
} from "lucide-react";

const HomeworkSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  

  const handleAskQuestion = () => {
    if (user) {
      navigate("/forum");
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
    navigate("/resources");
  };

  const handleStepByStepHelp = () => {
    if (user) {
      navigate("/homework-help");
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to access homework help.",
      });
      navigate("/auth");
    }
  };

  const handleFeatureClick = (featureTitle: string) => {
    switch (featureTitle) {
      case "Study Resources":
        navigate("/resources");
        break;
      case "Ask & Answer Forum":
        handleAskQuestion();
        break;
      case "Step-by-Step Solutions":
        handleStepByStepHelp();
        break;
      case "Quick Help":
        navigate("/quick-help");
        break;
      default:
        if (user) {
          navigate("/resources");
        } else {
          navigate("/auth");
        }
    }
  };

  const features = [
    {
      icon: HelpCircle,
      title: "Step-by-Step Solutions",
      description: "Get detailed step-by-step explanations and guidance for your homework problems"
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
                <Card 
                  key={feature.title} 
                  className="bg-gradient-card border shadow-card hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleFeatureClick(feature.title)}
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <Button variant="outline" size="lg" className="w-full" onClick={handleBrowseSolutions}>
                Browse Solution Bank
              </Button>
              
              {/* Homework Help Visual */}
              <div className="bg-gradient-card rounded-lg overflow-hidden border shadow-card">
                <div className="relative">
                  <img 
                    src={homeworkHelpImage} 
                    alt="Students collaborating on homework and learning together"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-sm mb-1">Get Help with Your Studies</h3>
                    <p className="text-white/90 text-xs">Join thousands of students getting step-by-step solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HomeworkSection;