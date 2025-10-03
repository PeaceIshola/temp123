import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  name: string;
  code: string;
  description: string;
  color: string;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  content: string;
  metadata?: {
    fileName?: string;
    bucketName?: string;
    subject?: string;
    area?: string;
    topic?: string;
  };
  topic: {
    title: string;
    sub_subject: {
      name: string;
    };
  };
}

const ResourcesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<string>(
    location.state?.selectedSubject || 'BST'
  );
  const [content, setContent] = useState<Content[]>([]);
  const [flashcardCounts, setFlashcardCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const subjects: Subject[] = [
    {
      name: "Basic Science & Technology",
      code: "BST",
      description: "Science, Technology, ICT, and Physical Health Education",
      color: "primary"
    },
    {
      name: "Prevocational Studies", 
      code: "PVS",
      description: "Agriculture and Home Economics education",
      color: "secondary"
    },
    {
      name: "National Values Education",
      code: "NV", 
      description: "Civic Education, Social Studies, and Security Education",
      color: "accent"
    }
  ];

  useEffect(() => {
    fetchContentWithFlashcards();
  }, [selectedSubject]);

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
          content,
          metadata,
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
        setContent(contentData as Content[]);
        
        // Get flashcard counts for each content item
        const counts: Record<string, number> = {};
        for (const item of contentData) {
          const { count } = await supabase
            .from('flashcards')
            .select('*', { count: 'exact', head: true })
            .eq('content_id', item.id);
          counts[item.id] = count || 0;
        }
        setFlashcardCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlashcardAccess = (contentId: string) => {
    navigate(`/flashcards/${contentId}`);
  };

  const handleDownloadPDF = async (fileName: string, bucketName: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'pdf': return FileText;
      case 'video': return Video;
      default: return FileText;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary/10 border-primary/20 text-primary';
      case 'secondary': return 'bg-secondary/10 border-secondary/20 text-secondary';
      case 'accent': return 'bg-accent/10 border-accent/20 text-accent';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  const currentSubject = subjects.find(s => s.code === selectedSubject) || subjects[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold">
              Study <span className="bg-gradient-hero bg-clip-text text-transparent">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Study with interactive flashcards for better retention and mastery
            </p>
          </div>

          {/* Subject Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {subjects.map((subject) => (
              <Button
                key={subject.code}
                variant={selectedSubject === subject.code ? "default" : "outline"}
                onClick={() => setSelectedSubject(subject.code)}
                className={selectedSubject === subject.code ? getColorClasses(subject.color) : ""}
              >
                {subject.name}
              </Button>
            ))}
          </div>

          {/* Selected Subject Info */}
          <div className="mb-8">
            <Card className={`${getColorClasses(currentSubject.color)} border-2`}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{currentSubject.name}</CardTitle>
                <CardDescription className="text-base">
                  {currentSubject.description} - Study with interactive flashcards for better retention
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Flashcards Section */}
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
                {content.map((item) => {
                  const IconComponent = getContentIcon(item.content_type);
                  const hasFlashcards = flashcardCounts[item.id] > 0;
                  const metadata = item.metadata as any;
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <Badge variant="outline" className="text-xs">
                            {item.content_type.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>
                          {item.topic.sub_subject.name} - {item.topic.title}
                        </CardDescription>
                        {metadata && (metadata.subject || metadata.area || metadata.topic) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {metadata.subject && (
                              <Badge variant="secondary" className="text-xs">
                                {metadata.subject}
                              </Badge>
                            )}
                            {metadata.area && (
                              <Badge variant="secondary" className="text-xs">
                                {metadata.area}
                              </Badge>
                            )}
                            {metadata.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {metadata.topic}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          {item.content_type === 'pdf' && metadata?.fileName && metadata?.bucketName && (
                            <Button
                              variant="outline"
                              onClick={() => handleDownloadPDF(metadata.fileName, metadata.bucketName, item.title)}
                              className="gap-2"
                              size="sm"
                            >
                              <FileText className="w-4 h-4" />
                              Download PDF
                            </Button>
                          )}
                          {hasFlashcards && (
                            <>
                              <div className="text-sm text-muted-foreground">
                                {flashcardCounts[item.id]} flashcards available
                              </div>
                              <Button
                                onClick={() => handleFlashcardAccess(item.id)}
                                className="gap-2"
                                size="sm"
                              >
                                <Brain className="w-4 h-4" />
                                Study Flashcards
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  <strong>Note:</strong> Flashcards are based on your learning materials. Study regularly to improve retention and mastery levels.
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