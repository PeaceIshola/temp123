import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TeacherDashboard from "./pages/TeacherDashboard";
import SubjectExplorer from "./pages/SubjectExplorer";
import Quizzes from "./pages/Quizzes";
import TakeQuiz from "./pages/TakeQuiz";
import Flashcards from "./pages/Flashcards";
import Resources from "./pages/Resources";
import Subscriptions from "./pages/Subscriptions";
import SolutionBank from "./pages/SolutionBank";
import Settings from "./pages/Settings";
import Forum from "./pages/Forum";
import HomeworkHelp from "./pages/HomeworkHelp";
import StudentDashboard from "./pages/StudentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:quizId" element={<TakeQuiz />} />
            <Route path="/flashcards/:contentId" element={<Flashcards />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/solution-bank" element={<SolutionBank />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/homework-help" element={<HomeworkHelp />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/explore/:subjectCode" element={<SubjectExplorer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
