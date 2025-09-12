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

          {/* Subscription Plans */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Access Card */}
            <Card className="border-border transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">Free Access</CardTitle>
                <CardDescription className="text-base">
                  Access all subject modules at no cost
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">Free</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    All subject modules
                  </li>
                  {subjects.map((subject) => (
                    <li key={subject.id} className="flex items-center text-sm ml-7">
                      <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
                      {subject.name}
                    </li>
                  ))}
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Basic practice questions
                  </li>
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Study materials
                  </li>
                </ul>

                <button className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                  Get Started Free
                </button>
              </CardContent>
            </Card>

            {/* Premium Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Premium Access</CardTitle>
                <CardDescription className="text-base">
                  Enhanced learning with advanced features
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">₦500</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Everything in Free plan
                  </li>
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Advanced practice questions
                  </li>
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Detailed solution explanations
                  </li>
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Progress tracking & analytics
                  </li>
                  <li className="flex items-center text-sm">
                    <Crown className="h-4 w-4 text-green-500 mr-3" />
                    Priority support
                  </li>
                </ul>

                <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Upgrade to Premium
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  <strong>Note:</strong> Free access provides full access to all subject modules and 
                  basic practice questions for JSS curriculum.
                </p>
                <p className="text-sm text-muted-foreground">
                  Premium subscription unlocks advanced practice questions, detailed explanations, 
                  progress tracking, and priority support across all subjects.
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