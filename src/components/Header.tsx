import { Book, Menu, GraduationCap, LogOut, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSecureProfiles } from "@/hooks/useSecureProfiles";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState(false);
  const [displayEmail, setDisplayEmail] = useState<string>('');
  const { anonymizeEmail } = useSecureProfiles();

  useEffect(() => {
    checkTeacherRole();
    if (user?.email) {
      // Anonymize email for display to prevent exposure
      anonymizeEmail(user.email).then(setDisplayEmail);
    }
  }, [user]);

  const checkTeacherRole = async () => {
    if (!user) {
      setIsTeacher(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setIsTeacher(data?.role === 'teacher');
    } catch (err) {
      console.error('Header role check failed:', err);
      setIsTeacher(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavigation = (section: string) => {
    // If we're not on the home page, navigate to home first
    if (window.location.pathname !== '/') {
      navigate('/', { replace: true });
      // Wait a moment for navigation, then scroll
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // We're already on home page, just scroll
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            EduNaija
          </span>
        </button>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => handleNavigation('home')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavigation('subjects')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Subjects
          </button>
          <button 
            onClick={() => handleNavigation('homework')} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Homework Help
          </button>
          <button 
            onClick={() => navigate("/quizzes")} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Quizzes
          </button>
          <button 
            onClick={() => navigate("/student-resources")} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Learning Materials
          </button>
          <button 
            onClick={() => navigate("/resources")} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Resources
          </button>
          <button 
            onClick={() => navigate("/subscriptions")} 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Subscriptions
          </button>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                   <span className="hidden md:inline text-sm">
                     {displayEmail || 'User'}
                   </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {isTeacher && (
                  <DropdownMenuItem onClick={() => navigate("/teacher")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Teacher Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:inline-flex"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button 
                variant="hero" 
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;