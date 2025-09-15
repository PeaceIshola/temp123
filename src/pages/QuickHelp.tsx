import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ExternalLink, Clock, HelpCircle } from "lucide-react";
import { usePopularQuestions } from "@/hooks/usePopularQuestions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  name: string;
  code: string;
  description: string;
  color: string;
  searchTerms: string[];
}

const QuickHelpPage = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('BST');
  const { questions: popularQuestions, loading: questionsLoading } = usePopularQuestions();

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

  const handleBookSearch = (searchTerm: string) => {
    const searchUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(searchTerm)}`;
    window.open(searchUrl, '_blank');
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary/10 border-primary/20 text-primary';
      case 'secondary': return 'bg-secondary/10 border-secondary/20 text-secondary';
      case 'accent': return 'bg-accent/10 border-accent/20 text-accent';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  const getSubjectColor = (subjectCode: string) => {
    switch (subjectCode) {
      case "BST": return "primary";
      case "PVS": return "secondary"; 
      case "NV": return "accent";
      default: return "primary";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-accent";
      case "Medium": return "text-secondary";
      case "Hard": return "text-destructive";
      default: return "text-muted-foreground";
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
              <span className="bg-gradient-hero bg-clip-text text-transparent">Quick Help</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant answers to frequently asked questions and search for educational books
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Book Search Section */}
            <div className="space-y-6">
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Book Search
                  </CardTitle>
                  <CardDescription>
                    Search for educational books related to JSS subjects using Google Books
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Subject Selector */}
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject.code}
                    variant={selectedSubject === subject.code ? "default" : "outline"}
                    onClick={() => setSelectedSubject(subject.code)}
                    className={selectedSubject === subject.code ? getColorClasses(subject.color) : ""}
                    size="sm"
                  >
                    {subject.name}
                  </Button>
                ))}
              </div>

              {/* Selected Subject Info */}
              <Card className={`${getColorClasses(currentSubject.color)} border-2`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{currentSubject.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {currentSubject.description}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Book Search Options */}
              <div className="grid sm:grid-cols-2 gap-4">
                {currentSubject.searchTerms.map((searchTerm, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" 
                        onClick={() => handleBookSearch(searchTerm)}>
                    <CardHeader className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-base leading-tight capitalize">
                        {searchTerm.replace(' books', '').replace(' textbooks', '')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookSearch(searchTerm);
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search Books
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Popular Questions Section */}
            <div className="space-y-6">
              <Card className="bg-gradient-card border shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-secondary" />
                    Popular Questions This Week
                  </CardTitle>
                  <CardDescription>
                    Get quick answers to frequently asked questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questionsLoading ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading popular questions...</p>
                    </div>
                  ) : popularQuestions.length > 0 ? (
                    popularQuestions.slice(0, 6).map((q) => {
                      const color = getSubjectColor(q.subject_code);
                      return (
                        <div key={q.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border hover:shadow-sm transition-shadow">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            color === 'primary' ? 'bg-primary/10 text-primary' :
                            color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                            'bg-accent/10 text-accent'
                          }`}>
                            {q.subject_code}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-2">{q.question_text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-xs ${getDifficultyColor(q.difficulty_level)}`}>{q.difficulty_level}</p>
                              <span className="text-xs text-muted-foreground">• {q.ask_count} times asked</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No popular questions this week yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  <strong>Note:</strong> Clicking on any book search option will open Google Books in a new tab. 
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

export default QuickHelpPage;