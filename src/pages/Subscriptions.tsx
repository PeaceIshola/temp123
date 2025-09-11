import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crown } from "lucide-react";

const SubscriptionsPage = () => {
  const { subjects, loading } = useSubscriptions();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Subject <span className="bg-gradient-hero bg-clip-text text-transparent">Subscriptions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Subscribe to specific subjects for enhanced learning resources and premium features
            </p>
          </div>

          {/* Features Overview */}
          <div className="mb-16">
            <Card className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Why Subscribe?</CardTitle>
                <CardDescription className="text-base">
                  Get access to premium educational content tailored to JSS curriculum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="font-semibold mb-2">Rich Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Access comprehensive study materials and resources
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h3 className="font-semibold mb-2">Targeted Practice</h3>
                    <p className="text-sm text-muted-foreground">
                      Practice questions aligned with your specific subjects
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold mb-2">Progress Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your learning progress with detailed analytics
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h3 className="font-semibold mb-2">Expert Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get help from qualified teachers and education experts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Subscriptions */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subjects.map((subject) => (
              <SubscriptionCard key={subject.id} subject={subject} />
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  <strong>Note:</strong> All subscriptions are per subject and provide access to 
                  enhanced learning materials specifically for that subject area.
                </p>
                <p className="text-sm text-muted-foreground">
                  Free access includes basic features. Premium subscriptions unlock advanced 
                  practice questions, detailed explanations, and progress tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionsPage;