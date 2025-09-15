import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudentHomeworkTracker from "@/components/student/StudentHomeworkTracker";

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              My Learning Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Track your homework questions and progress</p>
          </div>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">My Questions</TabsTrigger>
              <TabsTrigger value="ask">Ask New Question</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="space-y-4">
              <StudentHomeworkTracker />
            </TabsContent>
            
            <TabsContent value="ask" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Ask a New Question
                  </CardTitle>
                  <CardDescription>
                    Need help with your homework? Get step-by-step explanations from teachers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      Ready to get help with your homework?
                    </p>
                    <Button onClick={() => navigate('/homework-help')} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Your Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;