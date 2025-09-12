import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PDFFile {
  name: string;
  created_at: string;
  id: string;
  metadata?: {
    size?: number;
  };
}

interface PDFUploadProps {
  bucketName: 'content-pdfs' | 'solution-pdfs';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PDFUpload = ({ bucketName, title, description, icon }: PDFUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [title_, setTitle_] = useState("");

  // Fetch existing files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!title_.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the PDF",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create a unique filename
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${title_.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "PDF uploaded successfully",
      });

      // Reset form
      setTitle_("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh file list
      fetchFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileName: string) => {
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
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "PDF deleted successfully",
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">PDF Title</Label>
              <Input
                id="title"
                value={title_}
                onChange={(e) => setTitle_(e.target.value)}
                placeholder="Enter title for the PDF"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Upload PDF File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Select a PDF file to upload (max 10MB)
                </p>
                <Button 
                  onClick={handleFileSelect} 
                  disabled={loading || !title_.trim()}
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? "Uploading..." : "Choose PDF File"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded PDFs ({files.length})</CardTitle>
            <CardDescription>
              Manage your uploaded PDF files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{file.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        PDF
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.metadata?.size)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete PDF</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFile(file.name)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFUpload;
