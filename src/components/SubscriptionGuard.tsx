import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess, Feature } from '@/hooks/useFeatureAccess';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: Feature;
  requiresPremium?: boolean;
}

export function SubscriptionGuard({ 
  children, 
  feature, 
  requiresPremium = false 
}: SubscriptionGuardProps) {
  const { hasAccess, hasPremiumAccess, hasAnySubscription, loading } = useFeatureAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (requiresPremium && !hasPremiumAccess) {
      toast({
        title: "Premium subscription required",
        description: "This feature is only available for premium subscribers",
        variant: "destructive",
      });
      navigate('/subscriptions');
      return;
    }

    if (!hasAccess(feature)) {
      if (!hasAnySubscription) {
        toast({
          title: "Subscription required",
          description: "Please subscribe to a subject to access this feature",
          variant: "destructive",
        });
        navigate('/subscriptions');
      } else {
        toast({
          title: "Premium subscription required",
          description: "Upgrade to premium to access this feature",
          variant: "destructive",
        });
        navigate('/subscriptions');
      }
    }
  }, [user, loading, hasAccess, hasPremiumAccess, hasAnySubscription, feature, requiresPremium, navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requiresPremium && !hasPremiumAccess) || !hasAccess(feature)) {
    return null;
  }

  return <>{children}</>;
}
