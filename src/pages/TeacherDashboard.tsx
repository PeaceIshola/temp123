import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentUploadForm from "@/components/teacher/ContentUploadForm";
import QuizCreateForm from "@/components/teacher/QuizCreateForm";
import QuizManagement from "@/components/teacher/QuizManagement";
import SolutionsForm from "@/components/teacher/SolutionsForm";
import { FlashcardAutoGenerator } from "@/components/teacher/FlashcardAutoGenerator";
import HomeworkQuestionsManager from "@/components/teacher/HomeworkQuestionsManager";


const TeacherDashboard = () => {
  const { user, loading } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsTeacher(false);
      return;
    }
    checkTeacherRole();
  }, [user, loading]);

  const checkTeacherRole = async () => {
    try {
      console.log('Checking teacher role for user:', user?.id);
      const { data, error } = await supabase.rpc('get_current_user_role');
      console.log('RPC response:', { data, error });

      if (error) {
        console.warn('RPC failed, falling back to profiles query:', error);
      }

      const roleFromRpc = (data as string | null) || null;

      if (roleFromRpc) {
        setIsTeacher(roleFromRpc === 'teacher');
        return;
      }

      // Fallback: query profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching role from profiles:', profileError);
        setIsTeacher(false);
        return;
      }

      setIsTeacher(profile?.role === 'teacher');
    } catch (e) {
      console.error('Unexpected error checking role:', e);
      setIsTeacher(false);
    }
  };


  if (isTeacher === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isTeacher) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Upload learning modules for your students</p>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="content">Upload Content</TabsTrigger>
            <TabsTrigger value="homework">Homework Help</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz">Create Quiz</TabsTrigger>
            <TabsTrigger value="manage">Manage Quizzes</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <ContentUploadForm />
          </TabsContent>
          
          <TabsContent value="homework" className="space-y-4">
            <HomeworkQuestionsManager />
          </TabsContent>
          
          <TabsContent value="flashcards" className="space-y-4">
            <FlashcardAutoGenerator />
          </TabsContent>
          
          <TabsContent value="quiz" className="space-y-4">
            <QuizCreateForm />
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4">
            <QuizManagement />
          </TabsContent>
          
          <TabsContent value="solutions" className="space-y-4">
            <SolutionsForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;