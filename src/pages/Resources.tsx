import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Video, FileText, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Resource {
  title: string;
  description: string;
  url: string;
  type: 'website' | 'video' | 'document' | 'interactive';
  category: string;
}

interface SubjectResources {
  name: string;
  code: string;
  description: string;
  color: string;
  resources: Resource[];
}

const ResourcesPage = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('BST');

  const subjectResources: SubjectResources[] = [
    {
      name: "Basic Science & Technology",
      code: "BST",
      description: "Science, Technology, ICT, and Physical Health Education resources",
      color: "primary",
      resources: [
        {
          title: "Khan Academy - Basic Science",
          description: "Free online courses covering biology, chemistry, and physics fundamentals",
          url: "https://www.khanacademy.org/science",
          type: "website",
          category: "Basic Science"
        },
        {
          title: "BBC Bitesize - Science",
          description: "Interactive lessons and quizzes for science topics",
          url: "https://www.bbc.co.uk/bitesize/subjects/z2pfb9q",
          type: "interactive",
          category: "Basic Science"
        },
        {
          title: "Coursera - Computer Science Basics",
          description: "Introduction to computer science and programming concepts",
          url: "https://www.coursera.org/browse/computer-science",
          type: "website",
          category: "ICT"
        },
        {
          title: "YouTube - Crash Course Biology",
          description: "Engaging video series covering biology topics",
          url: "https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF",
          type: "video",
          category: "Basic Science"
        },
        {
          title: "MIT OpenCourseWare - Physics",
          description: "Free physics courses and materials from MIT",
          url: "https://ocw.mit.edu/courses/physics/",
          type: "website",
          category: "Basic Science"
        },
        {
          title: "Code.org - Hour of Code",
          description: "Introduction to programming and computer science",
          url: "https://code.org/learn",
          type: "interactive",
          category: "ICT"
        }
      ]
    },
    {
      name: "Prevocational Studies",
      code: "PVS",
      description: "Agriculture and Home Economics educational resources",
      color: "secondary",
      resources: [
        {
          title: "FAO - Agriculture Education",
          description: "Food and Agriculture Organization educational materials",
          url: "https://www.fao.org/education/en/",
          type: "website",
          category: "Agriculture"
        },
        {
          title: "4-H Curriculum Guides",
          description: "Youth development programs in agriculture and life sciences",
          url: "https://4-h.org/parents/curriculum/",
          type: "document",
          category: "Agriculture"
        },
        {
          title: "Home Economics Teaching Resources",
          description: "Comprehensive home economics curriculum and activities",
          url: "https://www.facs.org/",
          type: "website",
          category: "Home Economics"
        },
        {
          title: "YouTube - Modern Farming Techniques",
          description: "Educational videos on sustainable farming practices",
          url: "https://www.youtube.com/results?search_query=modern+farming+techniques+education",
          type: "video",
          category: "Agriculture"
        },
        {
          title: "Cornell Cooperative Extension",
          description: "Agricultural and food science educational resources",
          url: "https://cce.cornell.edu/",
          type: "website",
          category: "Agriculture"
        },
        {
          title: "Family & Consumer Sciences Resources",
          description: "Teaching materials for nutrition, textiles, and family studies",
          url: "https://www.aafcs.org/",
          type: "website",
          category: "Home Economics"
        }
      ]
    },
    {
      name: "National Values Education",
      code: "NV",
      description: "Civic Education, Social Studies, and Security Education resources",
      color: "accent",
      resources: [
        {
          title: "Nigeria's Constitution",
          description: "Official text of the Nigerian Constitution",
          url: "https://www.nigeria.gov.ng/constitution/",
          type: "document",
          category: "Civic Education"
        },
        {
          title: "BBC News - Nigeria",
          description: "Current affairs and news about Nigeria",
          url: "https://www.bbc.com/news/world/africa",
          type: "website",
          category: "Social Studies"
        },
        {
          title: "Encyclopedia Britannica - Nigeria",
          description: "Comprehensive information about Nigerian history and culture",
          url: "https://www.britannica.com/place/Nigeria",
          type: "website",
          category: "Social Studies"
        },
        {
          title: "National Geographic Kids - Nigeria",
          description: "Fun facts and educational content about Nigeria",
          url: "https://kids.nationalgeographic.com/geography/countries/article/nigeria",
          type: "interactive",
          category: "Social Studies"
        },
        {
          title: "UNICEF Nigeria - Child Rights",
          description: "Information about children's rights and protection in Nigeria",
          url: "https://www.unicef.org/nigeria/",
          type: "website",
          category: "Civic Education"
        },
        {
          title: "Nigerian Government Portal",
          description: "Official information about Nigerian government and services",
          url: "https://www.nigeria.gov.ng/",
          type: "website",
          category: "Civic Education"
        }
      ]
    }
  ];

  const getSubjectData = () => {
    return subjectResources.find(subject => subject.code === selectedSubject) || subjectResources[0];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'website': return <Globe className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'interactive': return <BookOpen className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
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
              Curated external resources to enhance your learning across all JSS subjects
            </p>
          </div>

          {/* Subject Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {subjectResources.map((subject) => (
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

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSubject.resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {resource.category}
                      </Badge>
                    </div>
                    <div className="ml-2">
                      {getTypeIcon(resource.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {resource.description}
                  </CardDescription>
                  
                  <Button 
                    asChild 
                    className="w-full" 
                    variant="outline"
                  >
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      Visit Resource
                      <ExternalLink className="h-4 w-4" />
                    </a>
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
                  <strong>Note:</strong> These external resources are provided for educational purposes. 
                  Always verify information with your teachers and official curriculum materials.
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