import { useState, useEffect } from "react";
import { FileImage, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

const DiagramUploadForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubSubject, setSelectedSubSubject] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [title, setTitle] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingTopics, setExistingTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubSubjects(selectedSubject);
      setSelectedSubSubject("");
      setCustomTopic("");
      setExistingTopics([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubSubject) {
      fetchExistingTopics(selectedSubSubject);
    }
  }, [selectedSubSubject]);

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

  const fetchExistingTopics = async (subSubjectId: string) => {
    const { data } = await supabase
      .from('diagrams')
      .select('topic')
      .eq('sub_subject_id', subSubjectId);

    if (data) {
      const topics = [...new Set(data.map(item => item.topic))].sort();
      setExistingTopics(topics);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const resetSelections = () => {
    setSelectedSubject("");
    setSelectedSubSubject("");
    setCustomTopic("");
    setTitle("");
    setUploadedFile(null);
    setExistingTopics([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubject || !selectedSubSubject || !customTopic.trim() || !uploadedFile) {
      toast({
        title: "Error",
        description: "Please fill in all fields and upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading diagram to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('diagrams')
        .upload(filePath, uploadedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, creating diagram entry...');

      const { error: diagramError } = await supabase
        .from('diagrams')
        .insert({
          title: title || uploadedFile.name,
          subject_id: selectedSubject,
          sub_subject_id: selectedSubSubject,
          topic: customTopic.trim(),
          file_path: filePath,
          file_size: uploadedFile.size,
          file_type: uploadedFile.type,
          created_by: user.id,
          is_published: true
        });

      if (diagramError) {
        console.error('Diagram creation error:', diagramError);
        throw diagramError;
      }

      console.log('Diagram entry created successfully');

      toast({
        title: "Success",
        description: "Diagram uploaded successfully",
      });

      setTitle("");
      setUploadedFile(null);
      setCustomTopic("");
      fetchExistingTopics(selectedSubSubject);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload diagram",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedSubSubjectData = subSubjects.find(s => s.id === selectedSubSubject);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Upload Diagrams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
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
                  <SelectContent className="bg-background border z-50">
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
                <Input
                  id="topic"
                  type="text"
                  placeholder="Type topic name..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  disabled={!selectedSubSubject}
                />
                {existingTopics.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Existing: {existingTopics.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {(selectedSubject || selectedSubSubject || customTopic) && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Selected:</strong> 
                  {selectedSubjectData && ` ${selectedSubjectData.name}`}
                  {selectedSubSubjectData && ` > ${selectedSubSubjectData.name}`}
                  {customTopic && ` > ${customTopic}`}
                </div>
                <Button variant="outline" size="sm" onClick={resetSelections} type="button">
                  Clear
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Diagram Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter diagram title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File (PDF or Image)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {uploadedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {(!selectedSubject || !selectedSubSubject || !customTopic.trim()) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Required:</strong> Please select Subject, Area, and enter a Topic before uploading. 
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedSubject || !selectedSubSubject || !customTopic.trim() || !uploadedFile}
              className="w-full"
            >
              {isSubmitting ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Diagram
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagramUploadForm;
