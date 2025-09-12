import { useState } from "react";
import PDFUpload from "./PDFUpload";
import { Upload, Microscope, Leaf, Computer, Heart, Wheat, Home, Scale, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ContentUploadForm = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const subjects = [
    {
      id: "bst",
      title: "Basic Science & Technology (BST)",
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
      subareas: [
        { name: "Agriculture", icon: Wheat, topics: ["Crop Production", "Animal Husbandry", "Farm Tools"] },
        { name: "Home Economics", icon: Home, topics: ["Nutrition", "Home Management", "Clothing & Textiles"] }
      ]
    },
    {
      id: "nv",
      title: "National Values Education (NV)",
      subareas: [
        { name: "Civic Education", icon: Scale, topics: ["Democracy", "Rights & Duties", "Government"] },
        { name: "Social Studies", icon: MapPin, topics: ["Nigerian Culture", "Geography", "Transportation"] },
        { name: "Security Education", icon: Shield, topics: ["Safety Tips", "Emergency Response", "Conflict Resolution"] }
      ]
    }
  ];

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const selectedAreaData = selectedSubjectData?.subareas.find(a => a.name === selectedArea);

  const resetSelections = () => {
    setSelectedSubject("");
    setSelectedArea("");
    setSelectedTopic("");
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
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedArea("");
                setSelectedTopic("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Area</label>
              <Select 
                value={selectedArea} 
                onValueChange={(value) => {
                  setSelectedArea(value);
                  setSelectedTopic("");
                }}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubjectData?.subareas.map((area) => (
                    <SelectItem key={area.name} value={area.name}>
                      <div className="flex items-center gap-2">
                        <area.icon className="h-4 w-4" />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select 
                value={selectedTopic} 
                onValueChange={setSelectedTopic}
                disabled={!selectedArea}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {selectedAreaData?.topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedSubject || selectedArea || selectedTopic) && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Selected:</strong> {selectedSubject && subjects.find(s => s.id === selectedSubject)?.title}
                {selectedArea && ` > ${selectedArea}`}
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
        bucketName="content-pdfs"
        title="Upload Content PDFs"
        description="Upload educational content materials as PDF files"
        icon={<Upload className="h-5 w-5" />}
        metadata={{
          subject: selectedSubject,
          area: selectedArea,
          topic: selectedTopic
        }}
      />
    </div>
  );
};

export default ContentUploadForm;