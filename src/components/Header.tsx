import { Book, Menu, GraduationCap, LogOut, User, BookOpen, Settings, Crown, Shield } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
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
      setIsAdmin(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const role = data?.role;
      setIsTeacher(role === 'teacher' || role === 'admin');
      setIsAdmin(role === 'admin');
    } catch (err) {
      console.error('Header role check failed:', err);
      setIsTeacher(false);
      setIsAdmin(false);
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
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline text-sm">
                    Settings
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {!isTeacher && (
                  <DropdownMenuItem onClick={() => navigate("/subscriptions")}>
                    <Crown className="h-4 w-4 mr-2" />
                    Subscriptions
                  </DropdownMenuItem>
                )}
                {isTeacher && (
                  <DropdownMenuItem onClick={() => navigate("/teacher")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Teacher Dashboard
                  </DropdownMenuItem>
                )}
                {(isTeacher || isAdmin) && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
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