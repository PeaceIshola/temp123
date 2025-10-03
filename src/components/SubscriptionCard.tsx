import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, BookOpen } from "lucide-react";
import { useSubscriptions, Subject, SubjectSubscription } from "@/hooks/useSubscriptions";

interface SubscriptionCardProps {
  subject: Subject;
}

export function SubscriptionCard({ subject }: SubscriptionCardProps) {
  const { createSubscription, getActiveSubscription, loading } = useSubscriptions();
  const activeSubscription = getActiveSubscription(subject.id);

  const handleSubscribe = async (type: 'free' | 'premium') => {
    await createSubscription(subject.id, type);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10";
      case "secondary": 
        return "border-secondary/20 hover:border-secondary/40 bg-gradient-to-br from-secondary/5 to-secondary/10";
      case "accent":
        return "border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-accent/10";
      default:
        return "border-border";
    }
  };

  return (
    <Card className={`${getColorClasses(subject.color)} transition-all duration-300 hover:shadow-lg`}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">{subject.name}</CardTitle>
        <CardDescription className="text-base">
          {subject.description}
        </CardDescription>
        
        {activeSubscription && (
          <Badge 
            variant={activeSubscription.subscription_type === 'premium' ? 'default' : 'secondary'}
            className="mt-2 self-center"
          >
            {activeSubscription.subscription_type === 'premium' && (
              <Crown className="h-3 w-3 mr-1" />
            )}
            {activeSubscription.subscription_type.toUpperCase()} SUBSCRIBER
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Free Plan */}
        <div className="p-4 rounded-lg border bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Free Access</h3>
            <span className="text-2xl font-bold">Free</span>
          </div>
          
          <ul className="space-y-2 mb-4">
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Subject modules
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Basic practice questions
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Study materials
            </li>
          </ul>

          <Button 
            variant={activeSubscription?.subscription_type === 'free' ? "default" : "outline"}
            size="sm" 
            className="w-full"
            onClick={() => handleSubscribe('free')}
            disabled={loading || activeSubscription?.subscription_type === 'free'}
          >
            {activeSubscription?.subscription_type === 'free' ? 'Current Plan' : 'Get Free Access'}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Premium Access</h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">₦2,000</span>
              <span className="text-sm text-muted-foreground">/year</span>
            </div>
          </div>
          
          <ul className="space-y-2 mb-4">
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Everything in Free plan
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Advanced practice questions
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Detailed solution explanations
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Progress tracking & analytics
            </li>
            <li className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Priority support
            </li>
          </ul>

          <Button 
            className="w-full"
            onClick={() => handleSubscribe('premium')}
            disabled={loading || activeSubscription?.subscription_type === 'premium'}
          >
            {activeSubscription?.subscription_type === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
          </Button>
        </div>

        {activeSubscription && activeSubscription.expires_at && (
          <div className="text-center text-sm text-muted-foreground">
            {activeSubscription.subscription_type === 'premium' && (
              <>Expires on {new Date(activeSubscription.expires_at).toLocaleDateString()}</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}