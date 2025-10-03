import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  ArrowRight,
  Search,
  FileText,
  X
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  content_type: string;
  subject_name: string;
  subject_code: string;
  topic_title: string;
  sub_subject_name: string;
}

const SubjectsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Auto-search as user types with debounce
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!user) {
      return;
    }

    setIsSearching(true);
    try {
      const { data: contentData, error } = await supabase
        .from("content")
        .select(`
          id,
          title,
          content_type,
          topic:topics!inner (
            title,
            sub_subject:sub_subjects!inner (
              name,
              subject:subjects!inner (
                name,
                code
              )
            )
          )
        `)
        .eq("is_published", true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      const results: SearchResult[] = (contentData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content_type: item.content_type,
        subject_name: item.topic.sub_subject.subject.name,
        subject_code: item.topic.sub_subject.subject.code,
        topic_title: item.topic.title,
        sub_subject_name: item.topic.sub_subject.name,
      }));

      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

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
      title: "Basic Science & Technology",
      description: "Master the fundamentals of science, technology, ICT, and physical health education",
      color: "primary",
      subareas: [
        { name: "Basic Science", icon: Microscope, topics: ["Photosynthesis", "Human Body Systems", "Energy & Forces"] },
        { name: "Basic Technology", icon: Computer, topics: ["Simple Machines", "Electrical Circuits", "Materials"] },
        { name: "Information and Communication Technology", icon: Computer, topics: ["Computer Basics", "Internet Safety", "Digital Skills"] },
        { name: "Physical & Health Education", icon: Heart, topics: ["Nutrition", "Exercise", "First Aid"] }
      ]
    },
    {
      id: "pvs", 
      title: "Prevocational Studies",
      description: "Explore practical skills in agriculture and home economics for everyday life",
      color: "secondary",
      subareas: [
        { name: "Agriculture", icon: Wheat, topics: ["Crop Production", "Animal Husbandry", "Farm Tools"] },
        { name: "Home Economics", icon: Home, topics: ["Nutrition", "Home Management", "Clothing & Textiles"] }
      ]
    },
    {
      id: "nv",
      title: "National Values Education", 
      description: "Build strong civic awareness and understanding of Nigerian society",
      color: "accent",
      subareas: [
        { name: "Civic Education", icon: Scale, topics: ["Democracy", "Rights & Duties", "Government"] },
        { name: "Social Studies", icon: MapPin, topics: ["Nigerian Culture", "Geography", "Transportation"] },
        { name: "Security Education", icon: Shield, topics: ["Safety Tips", "Emergency Response", "Conflict Resolution"] }
      ]
    }
  ];

  const handleResultClick = (result: SearchResult) => {
    navigate("/resources", { state: { selectedSubject: result.subject_code } });
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setIsSearchExpanded(false);
  };

  const toggleSearch = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to search for materials",
      });
      navigate("/auth");
      return;
    }
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      clearSearch();
    }
  };

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

        {/* Search Bar - Collapsed/Expanded */}
        <div className="max-w-2xl mx-auto mb-12">
          {!isSearchExpanded ? (
            // Collapsed: Show only search icon
            <div className="flex justify-center">
              <Button
                onClick={toggleSearch}
                variant="outline"
                size="lg"
                className="gap-2 hover:scale-105 transition-transform"
              >
                <Search className="h-5 w-5" />
                Search Materials
              </Button>
            </div>
          ) : (
            // Expanded: Show full search
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Start typing to search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="pl-10 pr-10"
                  />
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {isSearching && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Type at least 2 characters to search
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="mb-12">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Search Results ({searchResults.length})</span>
                  <Button variant="ghost" size="sm" onClick={clearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <Card
                      key={result.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-primary mt-1" />
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold">{result.title}</h4>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{result.content_type.toUpperCase()}</Badge>
                              <span>•</span>
                              <span>{result.subject_name}</span>
                              <span>•</span>
                              <span>{result.sub_subject_name}</span>
                              <span>•</span>
                              <span>{result.topic_title}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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