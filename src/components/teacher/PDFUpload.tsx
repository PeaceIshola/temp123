import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
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
  metadata?: {
    subject?: string;
    area?: string;
    topic?: string;
  };
}

const PDFUpload = ({ bucketName, title, description, icon, metadata }: PDFUploadProps) => {
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
          offset: 0
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const createContentRecord = async (fileName: string, uploadMetadata: { subject?: string; area?: string; topic?: string }) => {
    try {
      // First, get the subject ID
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', uploadMetadata.subject?.toUpperCase())
        .single();

      if (!subjects) return;

      // Get the sub-subject (area) ID
      const { data: subSubjects } = await supabase
        .from('sub_subjects')
        .select('id')
        .eq('subject_id', subjects.id)
        .eq('name', uploadMetadata.area)
        .single();

      if (!subSubjects) return;

      // Get or create the topic
      let topicId;
      const { data: existingTopic } = await supabase
        .from('topics')
        .select('id')
        .eq('sub_subject_id', subSubjects.id)
        .eq('title', uploadMetadata.topic)
        .single();

      if (existingTopic) {
        topicId = existingTopic.id;
      } else {
        // Create new topic
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({
            sub_subject_id: subSubjects.id,
            title: uploadMetadata.topic,
            description: `Learning materials for ${uploadMetadata.topic}`,
            content: ''
          })
          .select('id')
          .single();
        
        if (newTopic) {
          topicId = newTopic.id;
        }
      }

      if (topicId) {
        // Create content record
        await supabase
          .from('content')
          .insert({
            topic_id: topicId,
            title: title_,
            content: `PDF file: ${fileName}`,
            content_type: 'pdf',
            is_published: true,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            metadata: {
              fileName,
              bucketName,
              subject: uploadMetadata.subject,
              area: uploadMetadata.area,
              topic: uploadMetadata.topic
            }
          });
      }
    } catch (error) {
      console.error('Error creating content record:', error);
      // Don't throw error here - file upload was successful
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
          upsert: false,
          metadata: metadata || {}
        });

      if (error) throw error;

      // If metadata is provided, also create a content record in the database
      if (metadata && metadata.subject && metadata.area && metadata.topic) {
        await createContentRecord(fileName, metadata);
      }

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

      // Also delete content record if it exists
      await supabase
        .from('content')
        .delete()
        .eq('content_type', 'pdf')
        .like('content', `%${fileName}%`);

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

  const formatFileName = (fileName: string) => {
    // Remove timestamp prefix for display
    return fileName.replace(/^\d+-/, '').replace(/\.pdf$/, '');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-title">PDF Title</Label>
            <Input
              id="pdf-title"
              type="text"
              placeholder="Enter a descriptive title for your PDF"
              value={title_}
              onChange={(e) => setTitle_(e.target.value)}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <Button 
            onClick={handleFileSelect}
            disabled={loading || !title_.trim()}
            className="w-full"
          >
            {loading ? "Uploading..." : "Choose PDF File"}
          </Button>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatFileName(file.name)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.metadata?.size)} • 
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
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
                            Are you sure you want to delete this PDF? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFile(file.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
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