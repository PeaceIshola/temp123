import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Search, Brain, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  name: string;
  code: string;
  description: string;
  color: string;
  searchTerms: string[];
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  topic: {
    title: string;
    sub_subject: {
      name: string;
    };
  };
}

interface FlashcardCount {
  contentId: string;
  count: number;
}

const ResourcesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>('BST');
  const [activeTab, setActiveTab] = useState<'books' | 'flashcards'>('books');
  const [content, setContent] = useState<Content[]>([]);
  const [flashcardCounts, setFlashcardCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const subjects: Subject[] = [
    {
      name: "Basic Science & Technology",
      code: "BST",
      description: "Science, Technology, ICT, and Physical Health Education books",
      color: "primary",
      searchTerms: ["basic science technology books", "elementary science books", "ICT books for children", "physical education books"]
    },
    {
      name: "Prevocational Studies",
      code: "PVS",
      description: "Agriculture and Home Economics educational books",
      color: "secondary",
      searchTerms: ["agriculture books for students", "home economics textbooks", "farming education books", "domestic science books"]
    },
    {
      name: "National Values Education",
      code: "NV",
      description: "Civic Education, Social Studies, and Security Education books",
      color: "accent",
      searchTerms: ["civic education books", "social studies textbooks Nigeria", "national values books", "citizenship education books"]
    }
  ];

  useEffect(() => {
    if (activeTab === 'flashcards') {
      fetchContentWithFlashcards();
    }
  }, [activeTab, selectedSubject]);

  const fetchContentWithFlashcards = async () => {
    setLoading(true);
    try {
      // Get subject ID
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', selectedSubject)
        .single();

      if (!subjectData) return;

      // Get content for this subject
      const { data: contentData } = await supabase
        .from('content')
        .select(`
          id,
          title,
          content_type,
          topic:topics!inner (
            title,
            sub_subject:sub_subjects!inner (
              name,
              subject_id
            )
          )
        `)
        .eq('topic.sub_subject.subject_id', subjectData.id)
        .eq('is_published', true);

      if (contentData) {
        setContent(contentData);
        
        // Fetch flashcard counts for each content
        const counts: Record<string, number> = {};
        await Promise.all(
          contentData.map(async (item) => {
            const { count } = await supabase
              .from('flashcards')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', item.id);
            counts[item.id] = count || 0;
          })
        );
        setFlashcardCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectData = () => {
    return subjects.find(subject => subject.code === selectedSubject) || subjects[0];
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

  const handleBookSearch = (searchTerm: string) => {
    const googleBooksUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(searchTerm)}`;
    window.open(googleBooksUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFlashcardAccess = (contentId: string) => {
    if (user) {
      navigate(`/flashcards/${contentId}`);
    } else {
      navigate('/auth');
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'pdf':
        return FileText;
      case 'video':
        return Video;
      default:
        return BookOpen;
    }
  };

  const currentSubject = getSubjectData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Educational <span className="bg-gradient-hero bg-clip-text text-transparent">Resources</span>
            </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search for educational books related to JSS subjects using Google Books
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'books' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('books')}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Book Search
            </Button>
            <Button
              variant={activeTab === 'flashcards' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('flashcards')}
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Study Flashcards
            </Button>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {subjects.map((subject) => (
            <Button
              key={subject.code}
              variant={selectedSubject === subject.code ? "default" : "outline"}
              onClick={() => setSelectedSubject(subject.code)}
              className="min-w-[120px]"
            >
              {subject.code}
            </Button>
          ))}
        </div>

        {/* Selected Subject Info */}
        <div className="mb-8">
          <Card className={`${getColorClasses(currentSubject.color)} border-2`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{currentSubject.name}</CardTitle>
              <CardDescription className="text-base">
                {activeTab === 'books' ? currentSubject.description : 'Study with interactive flashcards for better retention'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Content Area */}
        {activeTab === 'books' ? (
          /* Book Search Options */
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentSubject.searchTerms.map((searchTerm, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => handleBookSearch(searchTerm)}>
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg leading-tight capitalize">
                    {searchTerm.replace(' books', '').replace(' textbooks', '')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookSearch(searchTerm);
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Books
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Flashcards Section */
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading study materials...</p>
              </div>
            ) : content.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Study Materials Available</h3>
                  <p className="text-muted-foreground text-center">
                    {user ? 
                      "No flashcards are available for this subject yet. Check back soon!" :
                      "Sign in to access study flashcards for your materials."
                    }
                  </p>
                  {!user && (
                    <Button className="mt-4" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content
                  .filter(item => flashcardCounts[item.id] > 0)
                  .map((item) => {
                    const IconComponent = getContentIcon(item.content_type);
                    return (
                      <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <Badge variant="outline">{item.content_type}</Badge>
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription>
                            {item.topic.sub_subject.name} • {item.topic.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {flashcardCounts[item.id]} flashcards available
                            </div>
                            <Button
                              onClick={() => handleFlashcardAccess(item.id)}
                              className="gap-2"
                              size="sm"
                            >
                              <Brain className="w-4 h-4" />
                              Study Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                <strong>Note:</strong> {activeTab === 'books' ? 
                  'Clicking on any search option will open Google Books in a new tab. Always verify book recommendations with your teachers and curriculum guidelines.' :
                  'Flashcards are based on your learning materials. Study regularly to improve retention and mastery levels.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResourcesPage;