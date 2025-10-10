import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Zap, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FlashcardGenerationResult {
  content_id: string;
  title: string;
  flashcards_created: number;
}

export function FlashcardAutoGenerator() {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [results, setResults] = useState<FlashcardGenerationResult[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [contentList, setContentList] = useState<any[]>([]);
  const [contentText, setContentText] = useState("");
  const { toast } = useToast();

  // Fetch content list for AI generation
  const fetchContentList = async () => {
    const { data, error } = await supabase
      .from('content')
      .select('id, title, content, content_type')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setContentList(data);
    }
  };

  useEffect(() => {
    fetchContentList();
  }, []);

  const generateMissingFlashcards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('generate_missing_flashcards');

      if (error) throw error;

      setResults(data || []);
      
      const totalGenerated = data?.reduce((sum, item) => sum + item.flashcards_created, 0) || 0;
      
      if (totalGenerated > 0) {
        toast({
          title: "Flashcards Generated!",
          description: `Successfully created ${totalGenerated} flashcards for ${data?.length} learning materials.`,
        });
      } else {
        toast({
          title: "All Set!",
          description: "All your learning materials already have flashcards.",
        });
      }
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIFlashcards = async () => {
    if (!selectedContent) {
      toast({
        title: "No Content Selected",
        description: "Please select a learning material first.",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    try {
      const content = contentList.find(c => c.id === selectedContent);
      if (!content) throw new Error('Content not found');

      const { data, error } = await supabase.functions.invoke('generate-ai-flashcards', {
        body: {
          contentId: content.id,
          contentTitle: content.title,
          contentText: contentText || content.content,
          contentType: content.content_type,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "AI Flashcards Generated!",
          description: `Successfully created ${data.count} AI-powered flashcards.`,
        });
        setContentText("");
        setSelectedContent("");
        await fetchContentList();
      } else {
        throw new Error(data?.error || 'Failed to generate flashcards');
      }
    } catch (error: any) {
      console.error('Error generating AI flashcards:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-5 w-5" />
          Automatic Flashcard Generation
        </CardTitle>
        <CardDescription>
          Generate study flashcards automatically for your uploaded learning materials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Auto-Generation</h4>
              <p className="text-sm text-muted-foreground">
                New materials automatically get flashcards when uploaded with 2-3 basic study questions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Same Title</h4>
              <p className="text-sm text-muted-foreground">
                Flashcards use the exact same title as your learning material for easy identification.
              </p>
            </div>
          </div>
        </div>

        {/* AI-Powered Generation Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-medium">AI-Powered Flashcard Generation</h4>
            <Badge variant="secondary" className="text-xs">Powered by Gemini AI</Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="content-select">Select Learning Material</Label>
              <select
                id="content-select"
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose content...</option>
                {contentList.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title} ({content.content_type})
                  </option>
                ))}
              </select>
            </div>

            {selectedContent && (
              <div>
                <Label htmlFor="content-text">Additional Context (Optional)</Label>
                <Textarea
                  id="content-text"
                  placeholder="Add any additional context or specific topics you want the flashcards to cover..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}

            <Button
              onClick={generateAIFlashcards}
              disabled={aiLoading || !selectedContent}
              className="w-full gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  AI Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Flashcards
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Basic Template Generation */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Basic Template Generation</h4>
            <Button
              onClick={generateMissingFlashcards}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate Basic Flashcards
                </>
              )}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Click to create flashcards for any existing materials that don't have them yet.
          </p>

          {results.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Recent Generation Results:</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {results.map((result) => (
                  <div key={result.content_id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium truncate">{result.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.flashcards_created} cards
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong>AI vs Basic:</strong> AI-powered generation creates intelligent, context-aware flashcards tailored to your content. Basic generation creates simple template flashcards. For best results, use AI generation.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}