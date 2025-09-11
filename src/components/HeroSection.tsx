import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-education.jpg";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartLearning = () => {
    if (user) {
      // Navigate to dashboard or subjects when implemented
      navigate("/#subjects");
    } else {
      navigate("/auth");
    }
  };

  const handleExploreSubjects = () => {
    document.getElementById("subjects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative py-20 lg:py-32 bg-gradient-bg overflow-hidden">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Master Your 
                <span className="bg-gradient-hero bg-clip-text text-transparent"> JSS Subjects</span> with Confidence
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Comprehensive learning platform for Nigerian Junior Secondary Students. 
                Master BST, PVS, and National Values with interactive lessons, homework help, and practice quizzes.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group" onClick={handleStartLearning}>
                {user ? "Continue Learning" : "Start Learning Now"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={handleExploreSubjects}>
                Explore Subjects
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Core Subjects</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-2">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="text-2xl font-bold text-secondary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-2">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div className="text-2xl font-bold text-accent">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Nigerian students learning together with educational materials"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 bg-gradient-card rounded-lg p-4 shadow-lg border">
              <div className="text-sm font-medium text-primary">BST</div>
              <div className="text-xs text-muted-foreground">Basic Science & Technology</div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gradient-card rounded-lg p-4 shadow-lg border">
              <div className="text-sm font-medium text-secondary">PVS</div>
              <div className="text-xs text-muted-foreground">Prevocational Studies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;