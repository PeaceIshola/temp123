import { Book, Menu, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            EduNaija
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </a>
          <a href="#subjects" className="text-sm font-medium hover:text-primary transition-colors">
            Subjects
          </a>
          <a href="#homework" className="text-sm font-medium hover:text-primary transition-colors">
            Homework Help
          </a>
          <a href="#quizzes" className="text-sm font-medium hover:text-primary transition-colors">
            Quizzes
          </a>
          <a href="#resources" className="text-sm font-medium hover:text-primary transition-colors">
            Resources
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            Sign In
          </Button>
          <Button variant="hero" size="sm">
            Get Started
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;