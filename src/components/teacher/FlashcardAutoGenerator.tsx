import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface FlashcardGenerationResult {
  content_id: string;
  title: string;
  flashcards_created: number;
}

export function FlashcardAutoGenerator() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlashcardGenerationResult[]>([]);
  const { toast } = useToast();

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

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Generate for Existing Materials</h4>
            <Button
              onClick={generateMissingFlashcards}
              disabled={loading}
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
                  Generate Missing Flashcards
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
            <strong>Note:</strong> Auto-generated flashcards are basic study prompts. You can create custom flashcards with specific questions through the Teacher Dashboard for more detailed study materials.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}