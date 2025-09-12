import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PDFFile {
  name: string;
  created_at: string;
  id: string;
  metadata?: {
    size?: number;
  };
}

const StudentResources = () => {
  const [contentFiles, setContentFiles] = useState<PDFFile[]>([]);
  const [solutionFiles, setSolutionFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Fetch content files
      const { data: contentData, error: contentError } = await supabase.storage
        .from('content-pdfs')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (contentError) {
        console.error('Error fetching content files:', contentError);
      } else {
        setContentFiles(contentData || []);
      }

      // Fetch solution files  
      const { data: solutionData, error: solutionError } = await supabase.storage
        .from('solution-pdfs')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (solutionError) {
        console.error('Error fetching solution files:', solutionError);
      } else {
        setSolutionFiles(solutionData || []);
      }

    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
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

      // Create download link
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
      console.error('Download error:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatFileName = (fileName: string) => {
    // Remove timestamp prefix and file extension for display
    return fileName.replace(/^\d+-/, '').replace(/\.pdf$/, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-4xl">
          <div className="text-center">Loading resources...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Learning Resources
          </h1>
          <p className="text-muted-foreground mt-2">Access educational content and solution guides</p>
        </div>

        {/* Content PDFs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Educational Content
            </CardTitle>
            <CardDescription>
              Learning materials and course content uploaded by teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentFiles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No content files available yet.</p>
            ) : (
              <div className="space-y-3">
                {contentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{formatFileName(file.name)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Size: {formatFileSize(file.metadata?.size)} • 
                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.name, 'content-pdfs')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solution PDFs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Solution Guides
            </CardTitle>
            <CardDescription>
              Answer keys and solution guides for practice materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {solutionFiles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No solution files available yet.</p>
            ) : (
              <div className="space-y-3">
                {solutionFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{formatFileName(file.name)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Size: {formatFileSize(file.metadata?.size)} • 
                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.name, 'solution-pdfs')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentResources;