import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  name: string;
  code: string;
  description: string;
  color: string;
  searchTerms: string[];
}

const ResourcesPage = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('BST');

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
                {currentSubject.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Book Search Options */}
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

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Clicking on any search option will open Google Books in a new tab. 
                Always verify book recommendations with your teachers and curriculum guidelines.
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