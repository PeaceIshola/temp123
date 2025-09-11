import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentUploadForm from "@/components/teacher/ContentUploadForm";
import QuizCreateForm from "@/components/teacher/QuizCreateForm";


const TeacherDashboard = () => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    checkTeacherRole();
  }, [user]);

  const checkTeacherRole = async () => {
    if (!user) {
      setIsTeacher(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setIsTeacher(data?.role === 'teacher');
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Learning Content & Assignments</TabsTrigger>
            <TabsTrigger value="quiz">Quizzes & Exercises</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <ContentUploadForm />
          </TabsContent>
          
          <TabsContent value="quiz" className="space-y-4">
            <QuizCreateForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;