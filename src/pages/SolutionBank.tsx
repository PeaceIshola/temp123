import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, Eye, EyeOff, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SolutionContent {
  id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
  metadata: any;
  topic: {
    title: string;
    sub_subject: {
      name: string;
    };
  };
}

const SolutionBank = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<SolutionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [expandedPDFs, setExpandedPDFs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchSolutions();
  }, [user, navigate]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      
      // Fetch content from solution-pdfs bucket
      const { data: solutionData } = await supabase
        .from('content')
        .select(`
          *,
          topic:topics(
            title,
            sub_subject:sub_subjects(name)
          )
        `)
        .eq('is_published', true)
        .eq('content_type', 'pdf')
        .eq('metadata->>bucketName', 'solution-pdfs')
        .order('created_at', { ascending: true });

      setSolutions(solutionData || []);
    } catch (error) {
      console.error('Error fetching solutions:', error);
      toast({
        title: "Error",
        description: "Failed to load solutions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileName: string, bucketName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getPDFViewUrl = async (fileName: string, bucketName: string) => {
    try {
      const { data } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 3600);
      
      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting PDF URL:', error);
      return null;
    }
  };

  const togglePDFView = (solutionId: string) => {
    const newExpanded = new Set(expandedPDFs);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedPDFs(newExpanded);
  };

  const filteredSolutions = solutions.filter(solution => {
    const matchesSearch = solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solution.topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solution.topic.sub_subject.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === "all" || 
                          solution.topic.sub_subject.name.toLowerCase().includes(selectedSubject.toLowerCase());
    
    return matchesSearch && matchesSubject;
  });

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-6xl">
          <div className="text-center">Loading solution bank...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-6xl space-y-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="mb-4"
          >
            ← Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Solution Bank
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse and access solution guides uploaded by your teachers
          </p>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search solutions by title, topic, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="basic science">Basic Science</SelectItem>
                    <SelectItem value="basic technology">Basic Technology</SelectItem>
                    <SelectItem value="ict">ICT</SelectItem>
                    <SelectItem value="phe">PHE</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="home economics">Home Economics</SelectItem>
                    <SelectItem value="civic education">Civic Education</SelectItem>
                    <SelectItem value="social studies">Social Studies</SelectItem>
                    <SelectItem value="security education">Security Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solutions Grid */}
        {filteredSolutions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No solutions found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedSubject !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Teachers haven't uploaded any solutions yet. Check back soon!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {filteredSolutions.length} Solution{filteredSolutions.length !== 1 ? 's' : ''} Available
              </h2>
            </div>
            
            <div className="grid gap-6">
              {filteredSolutions.map((solution) => (
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  isExpanded={expandedPDFs.has(solution.id)}
                  onToggleView={() => togglePDFView(solution.id)}
                  onDownload={() => downloadFile(solution.metadata?.fileName, solution.metadata?.bucketName || 'solution-pdfs')}
                  getPDFViewUrl={getPDFViewUrl}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Solution Card Component
const SolutionCard = ({ 
  solution, 
  isExpanded, 
  onToggleView, 
  onDownload, 
  getPDFViewUrl 
}: {
  solution: SolutionContent;
  isExpanded: boolean;
  onToggleView: () => void;
  onDownload: () => void;
  getPDFViewUrl: (fileName: string, bucketName: string) => Promise<string | null>;
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleViewPDF = async () => {
    if (!isExpanded && !pdfUrl && solution.metadata?.fileName) {
      setLoading(true);
      const url = await getPDFViewUrl(solution.metadata.fileName, solution.metadata.bucketName || 'solution-pdfs');
      setPdfUrl(url);
      setLoading(false);
    }
    onToggleView();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{solution.title}</CardTitle>
            <CardDescription className="mt-1">
              {solution.topic.sub_subject.name} • {solution.topic.title}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Solution
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Uploaded: {new Date(solution.created_at).toLocaleDateString()}
          </div>

          {solution.content_type === 'pdf' && solution.metadata?.fileName ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={handleViewPDF}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>Loading...</>
                  ) : isExpanded ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide Solution
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      View Solution
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              {isExpanded && pdfUrl && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[600px]"
                    title={`Solution - ${solution.title}`}
                    style={{ border: 'none' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm">{solution.content}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SolutionBank;