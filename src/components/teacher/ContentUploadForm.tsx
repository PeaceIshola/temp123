import { useState, useEffect } from "react";
import PDFUpload from "./PDFUpload";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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

const ContentUploadForm = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubSubject, setSelectedSubSubject] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubSubjects(selectedSubject);
      setSelectedSubSubject("");
      setCustomTopic("");
    }
  }, [selectedSubject]);

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

  const resetSelections = () => {
    setSelectedSubject("");
    setSelectedSubSubject("");
    setCustomTopic("");
  };

  // Get the selected data for metadata
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedSubSubjectData = subSubjects.find(s => s.id === selectedSubSubject);

  const getMetadata = async () => {
    if (!selectedSubjectData || !selectedSubSubjectData || !customTopic.trim()) return undefined;
    
    // First, try to find existing topic
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('sub_subject_id', selectedSubSubject)
      .eq('title', customTopic.trim())
      .maybeSingle();

    let topicId = existingTopic?.id;

    // If topic doesn't exist, create it
    if (!topicId) {
      const { data: newTopic } = await supabase
        .from('topics')
        .insert({
          sub_subject_id: selectedSubSubject,
          title: customTopic.trim(),
          description: `Learning materials for ${customTopic.trim()}`,
          content: ''
        })
        .select('id')
        .single();
      
      topicId = newTopic?.id;
    }
    
    return {
      subject: selectedSubjectData.code,
      area: selectedSubSubjectData.name,
      topic: customTopic.trim(),
      subjectId: selectedSubject,
      subSubjectId: selectedSubSubject,
      topicId: topicId
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Content Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button variant="outline" size="sm" onClick={resetSelections}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PDFUpload
        bucketName="content-pdfs"
        title="Upload Content PDFs"
        description="Upload educational content materials as PDF files"
        icon={<Upload className="h-5 w-5" />}
        metadata={getMetadata}
      />
    </div>
  );
};

export default ContentUploadForm;