import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-background to-muted/20 border-t">
      <div className="container py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                EduNaija
              </span>
            </div>
            <p className="text-muted-foreground">
              Empowering Nigerian Junior Secondary students with comprehensive learning resources and interactive educational tools.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                hello@edunaija.com
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Subjects</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Basic Science & Technology</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Prevocational Studies</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">National Values Education</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">All Subjects</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Learning Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Homework Help</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Practice Quizzes</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Study Resources</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Interactive Lessons</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Study Tips</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Career Guidance</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} EduNaija. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">About Us</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;