import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, BookOpen, FileText } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubSubject {
  id: string;
  name: string;
  subject_id: string;
}

interface Topic {
  id: string;
  title: string;
  sub_subject_id: string;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubSubject, setSelectedSubSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);

  // Form data
  const [contentTitle, setContentTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [contentType, setContentType] = useState("lesson");

  useEffect(() => {
    checkTeacherRole();
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubSubjects(selectedSubject);
      setSelectedSubSubject("");
      setSelectedTopic("");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubSubject) {
      fetchTopics(selectedSubSubject);
      setSelectedTopic("");
    }
  }, [selectedSubSubject]);

  const checkTeacherRole = async () => {
    if (!user) {
      setIsTeacher(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setIsTeacher(data?.role === 'teacher');
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .in('code', ['BST', 'PVS', 'NV'])
      .order('name');

    setSubjects(data || []);
  };

  const fetchSubSubjects = async (subjectId: string) => {
    const { data } = await supabase
      .from('sub_subjects')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');

    setSubSubjects(data || []);
  };

  const fetchTopics = async (subSubjectId: string) => {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('sub_subject_id', subSubjectId)
      .order('title');

    setTopics(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTopic || !contentTitle || !contentText) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('content')
        .insert({
          topic_id: selectedTopic,
          title: contentTitle,
          content: contentText,
          content_type: contentType,
          created_by: user?.id,
          is_published: true
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Module uploaded successfully",
      });

      // Reset form
      setContentTitle("");
      setContentText("");
      setSelectedSubject("");
      setSelectedSubSubject("");
      setSelectedTopic("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload module",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isTeacher === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isTeacher) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Upload learning modules for your students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Module
            </CardTitle>
            <CardDescription>
              Create educational content for BST, PVS, or NV subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subsubject">Area</Label>
                  <Select 
                    value={selectedSubSubject} 
                    onValueChange={setSelectedSubSubject}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {subSubjects.map((subSubject) => (
                        <SelectItem key={subSubject.id} value={subSubject.id}>
                          {subSubject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Select 
                    value={selectedTopic} 
                    onValueChange={setSelectedTopic}
                    disabled={!selectedSubSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Enter module title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Module Content</Label>
                <Textarea
                  id="content"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Enter your lesson content, instructions, or description"
                  className="min-h-[200px]"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                {loading ? "Uploading..." : "Upload Module"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;