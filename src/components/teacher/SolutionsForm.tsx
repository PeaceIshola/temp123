import { useState, useEffect } from "react";
import PDFUpload from "./PDFUpload";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

const SolutionsForm = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subSubjects, setSubSubjects] = useState<SubSubject[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubSubject, setSelectedSubSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubSubjects(selectedSubject);
      setSelectedSubSubject("");
      setSelectedTopic("");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubSubject) {
      fetchCustomTopics(selectedSubSubject);
      setSelectedTopic("");
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

  const fetchCustomTopics = async (subSubjectId: string) => {
    // Fetch unique custom topics from content metadata
    const { data } = await supabase
      .from('content')
      .select('metadata')
      .eq('metadata->>subSubjectId', subSubjectId)
      .not('metadata->>topic', 'is', null);

    if (data) {
      const topics = data
        .map(item => {
          const metadata = item.metadata as Record<string, any>;
          return metadata?.topic as string;
        })
        .filter((topic, index, self) => topic && self.indexOf(topic) === index)
        .sort();
      setCustomTopics(topics);
    } else {
      setCustomTopics([]);
    }
  };

  const resetSelections = () => {
    setSelectedSubject("");
    setSelectedSubSubject("");
    setSelectedTopic("");
  };

  // Get the selected data for metadata
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedSubSubjectData = subSubjects.find(s => s.id === selectedSubSubject);

  const getMetadata = () => {
    if (!selectedSubjectData || !selectedSubSubjectData || !selectedTopic) return undefined;
    
    return {
      subject: selectedSubjectData.code,
      area: selectedSubSubjectData.name,
      topic: selectedTopic,
      subjectId: selectedSubject,
      subSubjectId: selectedSubSubject,
      topicId: null
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Solution Organization
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
              <Select 
                value={selectedTopic} 
                onValueChange={setSelectedTopic}
                disabled={!selectedSubSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {customTopics.map((topic, index) => (
                    <SelectItem key={index} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedSubject || selectedSubSubject || selectedTopic) && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Selected:</strong> 
                {selectedSubjectData && ` ${selectedSubjectData.name}`}
                {selectedSubSubjectData && ` > ${selectedSubSubjectData.name}`}
                {selectedTopic && ` > ${selectedTopic}`}
              </div>
              <Button variant="outline" size="sm" onClick={resetSelections}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PDFUpload
        bucketName="solution-pdfs"
        title="Upload Solution PDFs"
        description="Upload solution guides and answer keys as PDF files"
        icon={<BookOpen className="h-5 w-5" />}
        metadata={getMetadata()}
      />
    </div>
  );
};

export default SolutionsForm;
