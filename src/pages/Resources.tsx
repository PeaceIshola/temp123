import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ResourcesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold">
              Study <span className="bg-gradient-hero bg-clip-text text-transparent">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access educational materials and resources for your JSS subjects
            </p>
          </div>

          {/* Content Area */}
          <div className="text-center py-16">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4">Study Resources</h3>
                <p className="text-muted-foreground text-lg">
                  Study resources and materials are available through other sections of the platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Button onClick={() => navigate('/forum')} className="gap-2">
                    <Search className="w-4 h-4" />
                    Ask Questions in Forum
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/solution-bank')} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Browse Solutions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResourcesPage;