import { useState } from "react";
import { Search, BookOpen, FileText, Video, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  title: string;
  content_type: string;
  topic_title: string;
  subject_name: string;
  subject_code: string;
}

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data: contentData, error } = await supabase
        .from("content")
        .select(`
          id,
          title,
          content_type,
          topic_id,
          topics (
            title,
            sub_subject_id,
            sub_subjects (
              subject_id,
              subjects (
                name,
                code
              )
            )
          )
        `)
        .eq("is_published", true)
        .ilike("title", `%${searchQuery}%`);

      if (error) throw error;

      const results: SearchResult[] = (contentData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content_type: item.content_type,
        topic_title: item.topics?.title || "Unknown Topic",
        subject_name: item.topics?.sub_subjects?.subjects?.name || "Unknown Subject",
        subject_code: item.topics?.sub_subjects?.subjects?.code || "",
      }));

      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try different keywords or browse subjects below",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate("/resources", { state: { selectedSubject: result.subject_code } });
  };

  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Search Learning Materials</h2>
          <p className="text-muted-foreground">
            Find study materials, resources, and content across all subjects
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for topics, subjects, materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Search Results ({searchResults.length})</h3>
            <div className="grid gap-4">
              {searchResults.map((result) => (
                <Card 
                  key={result.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getContentIcon(result.content_type)}
                          {result.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {result.topic_title}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant="secondary">{result.subject_name}</Badge>
                        <Badge variant="outline">{result.content_type.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchSection;
