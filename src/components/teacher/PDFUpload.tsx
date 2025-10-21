import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PDFFile {
  name: string;
  created_at: string;
  id: string;
  metadata?: {
    size?: number;
  };
  categoryInfo?: {
    subject?: string;
    area?: string;
    topic?: string;
  };
}

interface PDFUploadProps {
  bucketName: 'content-pdfs' | 'solution-pdfs';
  title: string;
  description: string;
  icon: React.ReactNode;
  metadata?: (() => Promise<{
    subject?: string;
    area?: string;
    topic?: string;
    subjectId?: string;
    subSubjectId?: string;
    topicId?: string;
  } | undefined>) | {
    subject?: string;
    area?: string;
    topic?: string;
    subjectId?: string;
    subSubjectId?: string;
    topicId?: string;
  };
  isMetadataReady?: boolean;
}

const PDFUpload = ({ bucketName, title, description, icon, metadata, isMetadataReady = false }: PDFUploadProps) => {
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
      
      // Fetch category information from content table
      const filesWithCategories = await Promise.all((data || []).map(async (file) => {
        const { data: contentData } = await supabase
          .from('content')
          .select('metadata')
          .eq('content_type', 'pdf')
          .like('content', `%${file.name}%`)
          .maybeSingle();
        
        const categoryInfo = contentData?.metadata as any;
        return {
          ...file,
          categoryInfo: categoryInfo ? {
            subject: categoryInfo.subject,
            area: categoryInfo.area,
            topic: categoryInfo.topic
          } : undefined
        };
      }));
      
      // Sort by created_at descending (newest first)
      filesWithCategories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setFiles(filesWithCategories);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const createContentRecord = async (fileName: string, uploadMetadata: { subjectId?: string; subSubjectId?: string; topicId?: string; subject?: string; area?: string; topic?: string }) => {
    try {
      console.log('Creating content record with metadata:', uploadMetadata);
      const topicId = uploadMetadata.topicId;

      // topicId should already be set by ContentUploadForm.getMetadata()
      if (topicId) {
        console.log('Creating content record for topicId:', topicId);
        // Create content record
        const { data: contentData, error: contentError } = await supabase
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
              ...uploadMetadata
            }
          })
          .select();

        if (contentError) {
          console.error('Error creating content record:', contentError);
        } else {
          console.log('Content record created successfully:', contentData);
        }
      } else {
        console.error('No topicId available for content creation');
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

      // Resolve metadata first if it's a function
      let dbMetadata = null;
      if (metadata) {
        try {
          dbMetadata = typeof metadata === 'function' ? await metadata() : metadata;
          console.log('Resolved metadata before upload:', dbMetadata);
          
          // For content-pdfs, topicId is required. For solution-pdfs, it's optional
          if (bucketName === 'content-pdfs' && (!dbMetadata || !dbMetadata.topicId)) {
            console.error('Invalid metadata - missing topicId:', dbMetadata);
            toast({
              title: "Error",
              description: "Failed to create content record. Please try again.",
              variant: "destructive",
            });
            return;
          }
          
          // For solution-pdfs, we need at least subject, area, and topic
          if (bucketName === 'solution-pdfs' && (!dbMetadata || !dbMetadata.subject || !dbMetadata.area || !dbMetadata.topic)) {
            console.error('Invalid metadata - missing required fields:', dbMetadata);
            toast({
              title: "Error",
              description: "Please select subject, area, and topic before uploading.",
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error('Error resolving metadata:', error);
          toast({
            title: "Error",
            description: "Failed to prepare content. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: dbMetadata ? {
            subject: dbMetadata.subject,
            area: dbMetadata.area,
            topic: dbMetadata.topic,
            title: title_
          } : {}
        });

      if (error) throw error;

      // Create content record in the database (only if we have topicId for content-pdfs)
      if (dbMetadata) {
        if (bucketName === 'content-pdfs' && dbMetadata.topicId) {
          console.log('Creating content record for content-pdfs with metadata:', dbMetadata);
          await createContentRecord(fileName, dbMetadata);
        } else if (bucketName === 'solution-pdfs') {
          // For solution-pdfs, store metadata in a simplified way without requiring topicId
          console.log('Storing solution PDF metadata:', dbMetadata);
          // The file is uploaded, metadata is stored in storage, no content record needed for solutions
        }
      }

      toast({
        title: "Success!",
        description: "PDF uploaded successfully! Flashcards will be automatically generated for student study.",
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
            disabled={loading || !title_.trim() || !isMetadataReady}
            className="w-full"
          >
            {loading ? "Uploading..." : "Choose PDF File"}
          </Button>
          {!isMetadataReady && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Please select Subject, Area, and Topic above before uploading
            </p>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{formatFileName(file.name)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.metadata?.size)} • 
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      {file.categoryInfo && (file.categoryInfo.subject || file.categoryInfo.area || file.categoryInfo.topic) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {file.categoryInfo.subject && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                              {file.categoryInfo.subject}
                            </span>
                          )}
                          {file.categoryInfo.area && (
                            <span className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground rounded">
                              {file.categoryInfo.area}
                            </span>
                          )}
                          {file.categoryInfo.topic && (
                            <span className="px-2 py-0.5 bg-accent/10 text-accent-foreground rounded">
                              {file.categoryInfo.topic}
                            </span>
                          )}
                        </div>
                      )}
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
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFUpload;