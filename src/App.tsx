import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
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
import QuickHelp from "./pages/QuickHelp";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Teacher/Admin routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Free subscription features */}
            <Route path="/forum" element={
              <SubscriptionGuard feature="forum">
                <Forum />
              </SubscriptionGuard>
            } />
            <Route path="/solution-bank" element={
              <SubscriptionGuard feature="solution-bank">
                <SolutionBank />
              </SubscriptionGuard>
            } />
            <Route path="/explore/:subjectCode" element={
              <SubscriptionGuard feature="subjects">
                <SubjectExplorer />
              </SubscriptionGuard>
            } />
            
            {/* Premium only features */}
            <Route path="/quizzes" element={
              <SubscriptionGuard feature="quizzes" requiresPremium>
                <Quizzes />
              </SubscriptionGuard>
            } />
            <Route path="/quiz/:quizId" element={
              <SubscriptionGuard feature="quizzes" requiresPremium>
                <TakeQuiz />
              </SubscriptionGuard>
            } />
            <Route path="/flashcards/:contentId" element={
              <SubscriptionGuard feature="flashcards" requiresPremium>
                <Flashcards />
              </SubscriptionGuard>
            } />
            <Route path="/resources" element={
              <SubscriptionGuard feature="resources" requiresPremium>
                <Resources />
              </SubscriptionGuard>
            } />
            <Route path="/homework-help" element={
              <SubscriptionGuard feature="homework-help" requiresPremium>
                <HomeworkHelp />
              </SubscriptionGuard>
            } />
            <Route path="/quick-help" element={
              <SubscriptionGuard feature="homework-help" requiresPremium>
                <QuickHelp />
              </SubscriptionGuard>
            } />
            <Route path="/student-dashboard" element={
              <SubscriptionGuard feature="student-dashboard" requiresPremium>
                <StudentDashboard />
              </SubscriptionGuard>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
