import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Microscope, 
  Leaf, 
  Computer, 
  Heart, 
  Wheat, 
  Home, 
  Scale, 
  MapPin, 
  Shield,
  ArrowRight 
} from "lucide-react";

const SubjectsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubjectClick = (subjectCode: string) => {
    if (user) {
      navigate(`/explore/${subjectCode.toLowerCase()}`);
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to access subject content.",
      });
      navigate("/auth");
    }
  };


  const subjects = [
    {
      id: "bst",
      title: "Basic Science & Technology (BST)",
      description: "Master the fundamentals of science, technology, ICT, and physical health education",
      color: "primary",
      subareas: [
        { name: "Basic Science", icon: Microscope, topics: ["Photosynthesis", "Human Body Systems", "Energy & Forces"] },
        { name: "Basic Technology", icon: Computer, topics: ["Simple Machines", "Electrical Circuits", "Materials"] },
        { name: "ICT", icon: Computer, topics: ["Computer Basics", "Internet Safety", "Digital Skills"] },
        { name: "PHE", icon: Heart, topics: ["Nutrition", "Exercise", "First Aid"] }
      ]
    },
    {
      id: "pvs", 
      title: "Prevocational Studies (PVS)",
      description: "Explore practical skills in agriculture and home economics for everyday life",
      color: "secondary",
      subareas: [
        { name: "Agriculture", icon: Wheat, topics: ["Crop Production", "Animal Husbandry", "Farm Tools"] },
        { name: "Home Economics", icon: Home, topics: ["Nutrition", "Home Management", "Clothing & Textiles"] }
      ]
    },
    {
      id: "nv",
      title: "National Values Education (NV)", 
      description: "Build strong civic awareness and understanding of Nigerian society",
      color: "accent",
      subareas: [
        { name: "Civic Education", icon: Scale, topics: ["Democracy", "Rights & Duties", "Government"] },
        { name: "Social Studies", icon: MapPin, topics: ["Nigerian Culture", "Geography", "Transportation"] },
        { name: "Security Education", icon: Shield, topics: ["Safety Tips", "Emergency Response", "Conflict Resolution"] }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10";
      case "secondary": 
        return "border-secondary/20 hover:border-secondary/40 bg-gradient-to-br from-secondary/5 to-secondary/10";
      case "accent":
        return "border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-accent/10";
      default:
        return "border-border";
    }
  };

  return (
    <section id="subjects" className="py-20 bg-background">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Explore Your <span className="bg-gradient-hero bg-clip-text text-transparent">Core Subjects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive coverage of Nigerian Junior Secondary curriculum with interactive lessons and practical examples
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {subjects.map((subject) => (
            <Card key={subject.id} className={`${getColorClasses(subject.color)} border-2 transition-all duration-300 hover:shadow-lg group`}>
              <CardHeader>
                <CardTitle className="text-xl">{subject.title}</CardTitle>
                <CardDescription className="text-base">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {subject.subareas.map((subarea) => (
                    <div key={subarea.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <subarea.icon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{subarea.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-7">
                        {subarea.topics.map((topic) => (
                          <span 
                            key={topic}
                            className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="subject" 
                  className="w-full group"
                  onClick={() => handleSubjectClick(subject.id)}
                >
                  Explore {subject.title.split(" ")[0]}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;