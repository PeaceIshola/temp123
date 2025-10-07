import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: 'subjects' | 'forum' | 'solution-bank' | 'quizzes' | 'flashcards' | 'resources' | 'homework-help' | 'quick-help' | 'student-dashboard';
}

export const SubscriptionGuard = ({ children, feature }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isTeacher, isAdmin } = useUserRole();
  const { hasAccess, loading, isPremiumFeature } = useFeatureAccess();

  useEffect(() => {
    // Teachers and admins always have access
    if (isTeacher || isAdmin) {
      return;
    }

    if (!loading) {
      // If not authenticated, redirect to auth
      if (!user) {
        toast.error('Please sign in to access this feature');
        navigate('/auth');
        return;
      }

      // Check if user has access to this feature
      if (!hasAccess(feature)) {
        const featureName = feature.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        toast.error(
          isPremiumFeature(feature)
            ? `${featureName} is a premium feature. Please upgrade your subscription.`
            : `You need an active subscription to access ${featureName}`
        );
        navigate('/subscriptions');
      }
    }
  }, [user, loading, hasAccess, feature, navigate, isPremiumFeature, isTeacher, isAdmin]);

  if (loading && !isTeacher && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || (!hasAccess(feature) && !isTeacher && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};
