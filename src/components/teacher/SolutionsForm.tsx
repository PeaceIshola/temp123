import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Content {
  id: string;
  title: string;
  content_type: string;
  topic_id: string;
}

interface Solution {
  id: string;
  title: string;
  solution_type: string;
  solution_content: string;
  content_id: string;
  is_published: boolean;
}

const SolutionsForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<Content[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedContent, setSelectedContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Form data
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionType, setSolutionType] = useState("general");
  const [solutionContent, setSolutionContent] = useState("");
  const [resources, setResources] = useState<string[]>([""]);

  useEffect(() => {
    fetchContentItems();
    fetchSolutions();
  }, []);

  const fetchContentItems = async () => {
    const { data } = await supabase
      .from('content')
      .select('id, title, content_type, topic_id')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });

    setContentItems(data || []);
  };

  const fetchSolutions = async () => {
    const { data } = await supabase
      .from('solutions')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });

    setSolutions(data || []);
  };

  const addResource = () => {
    setResources([...resources, ""]);
  };

  const updateResource = (index: number, value: string) => {
    const newResources = [...resources];
    newResources[index] = value;
    setResources(newResources);
  };

  const removeResource = (index: number) => {
    if (resources.length > 1) {
      setResources(resources.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContent || !solutionTitle || !solutionContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const filteredResources = resources.filter(r => r.trim() !== "");
      
      const { data, error } = await supabase
        .from('solutions')
        .insert({
          content_id: selectedContent,
          title: solutionTitle,
          solution_type: solutionType,
          solution_content: solutionContent,
          additional_resources: filteredResources,
          created_by: user?.id,
          is_published: true
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Solution created successfully",
      });

      // Reset form
      setSolutionTitle("");
      setSolutionContent("");
      setSelectedContent("");
      setResources([""]);
      fetchSolutions();
    } catch (error: any) {
      console.error('Solution creation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create solution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (solutionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('solutions')
        .update({ is_published: !currentStatus })
        .eq('id', solutionId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Solution ${!currentStatus ? 'published' : 'unpublished'}`,
      });

      fetchSolutions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update solution",
        variant: "destructive",
      });
    }
  };

  const deleteSolution = async (solutionId: string) => {
    try {
      const { error } = await supabase
        .from('solutions')
        .delete()
        .eq('id', solutionId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Solution deleted successfully",
      });

      fetchSolutions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete solution",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create Solution/Answer Key
          </CardTitle>
          <CardDescription>
            Create detailed solutions and answer keys for your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Select Content</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content to create solution for" />
                </SelectTrigger>
                <SelectContent>
                  {contentItems.map((content) => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.title} ({content.content_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Solution Title</Label>
                <Input
                  id="title"
                  value={solutionTitle}
                  onChange={(e) => setSolutionTitle(e.target.value)}
                  placeholder="Enter solution title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Solution Type</Label>
                <Select value={solutionType} onValueChange={setSolutionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Solution</SelectItem>
                    <SelectItem value="step_by_step">Step by Step</SelectItem>
                    <SelectItem value="video">Video Solution</SelectItem>
                    <SelectItem value="document">Document/PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Solution Content</Label>
              <Textarea
                id="content"
                value={solutionContent}
                onChange={(e) => setSolutionContent(e.target.value)}
                placeholder="Enter detailed solution, answer key, or explanation"
                className="min-h-[200px]"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional Resources (URLs, links)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addResource}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </Button>
              </div>
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={resource}
                      onChange={(e) => updateResource(index, e.target.value)}
                      placeholder="Enter URL or resource link"
                      className="flex-1"
                    />
                    {resources.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Solution"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Solutions */}
      {solutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Solutions ({solutions.length})</CardTitle>
            <CardDescription>
              Manage your existing solutions and answer keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solutions.map((solution) => (
                <div key={solution.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{solution.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {solution.solution_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={solution.is_published ? "default" : "secondary"}>
                        {solution.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(solution.id, solution.is_published)}
                    >
                      {solution.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Solution</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{solution.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSolution(solution.id)}>
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

export default SolutionsForm;
