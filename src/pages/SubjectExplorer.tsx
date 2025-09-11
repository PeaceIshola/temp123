import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, FileText, Video, ClipboardList } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface SubSubject {
  id: string;
  name: string;
  description: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface Content {
  id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
  topic: {
    title: string;
    sub_subject: {
      name: string;
    };
  };
}

const SubjectExplorer = () => {
  const { subjectCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [selectedSubSubject, setSelectedSubSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectCode) {
      fetchSubjectData();
    }
  }, [subjectCode]);

  useEffect(() => {
    if (selectedSubSubject) {
      fetchTopicsAndContent(selectedSubSubject);
    }
  }, [selectedSubSubject]);

  const fetchSubjectData = async () => {
    setLoading(true);
    
    // Fetch subject
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('*')
      .eq('code', subjectCode?.toUpperCase())
      .single();

    if (subjectData) {
      setSubject(subjectData);
      
      // Fetch sub-subjects
      const { data: subSubjectsData } = await supabase
        .from('sub_subjects')
        .select('*')
        .eq('subject_id', subjectData.id)
        .order('name');

      setSubSubjects(subSubjectsData || []);
      
      if (subSubjectsData && subSubjectsData.length > 0) {
        setSelectedSubSubject(subSubjectsData[0].id);
      }
    }
    
    setLoading(false);
  };

  const fetchTopicsAndContent = async (subSubjectId: string) => {
    // Fetch topics
    const { data: topicsData } = await supabase
      .from('topics')
      .select('*')
      .eq('sub_subject_id', subSubjectId)
      .order('order_index', { ascending: true });

    setTopics(topicsData || []);

    // Fetch content for this sub-subject
    const { data: contentData } = await supabase
      .from('content')
      .select(`
        *,
        topic:topics(
          title,
          sub_subject:sub_subjects(name)
        )
      `)
      .eq('is_published', true)
      .in('topic_id', (topicsData || []).map(t => t.id))
      .order('created_at', { ascending: false });

    setContent(contentData || []);
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return Video;
      case 'assignment':
        return ClipboardList;
      case 'exercise':
        return ClipboardList;
      default:
        return FileText;
    }
  };

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'assignment':
        return 'bg-yellow-100 text-yellow-800';
      case 'exercise':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to explore subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subject Not Found</CardTitle>
            <CardDescription>The requested subject could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-6">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            {subject.name}
          </h1>
          <p className="text-muted-foreground mt-2">{subject.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sub-subjects sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subSubjects.map((subSubject) => (
                  <Button
                    key={subSubject.id}
                    variant={selectedSubSubject === subSubject.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedSubSubject(subSubject.id)}
                  >
                    {subSubject.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Content area */}
          <div className="lg:col-span-3">
            {content.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content available yet</h3>
                  <p className="text-muted-foreground text-center">
                    Check back soon! Teachers are working on adding new learning materials.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Learning Materials</h2>
                <div className="grid gap-4">
                  {content.map((item) => {
                    const IconComponent = getContentIcon(item.content_type);
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                            <Badge className={getContentTypeColor(item.content_type)}>
                              {item.content_type}
                            </Badge>
                          </div>
                          <CardDescription>
                            {item.topic.sub_subject.name} • {item.topic.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <div className="text-sm text-muted-foreground mb-3">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            <div className="whitespace-pre-wrap">{item.content}</div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectExplorer;