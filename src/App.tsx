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
import Resources from "./pages/Resources";

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
            <Route path="/resources" element={<Resources />} />
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
