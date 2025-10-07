import { useSubscriptions } from './useSubscriptions';
import { useUserRole } from './useUserRole';

export type Feature = 
  | 'subjects'
  | 'forum'
  | 'solution-bank'
  | 'quizzes'
  | 'flashcards'
  | 'resources'
  | 'homework-help'
  | 'student-dashboard';

const FREE_FEATURES: Feature[] = ['subjects', 'forum', 'solution-bank'];

export function useFeatureAccess() {
  const { getAllActiveSubscriptions, loading } = useSubscriptions();
  const { isTeacher, isAdmin } = useUserRole();

  // Teachers and admins have full access
  if (isTeacher || isAdmin) {
    return {
      hasAccess: () => true,
      hasPremiumAccess: true,
      hasAnySubscription: true,
      loading,
    };
  }

  const activeSubscriptions = getAllActiveSubscriptions();
  const hasPremium = activeSubscriptions.some(sub => sub.subscription_type === 'premium');
  const hasFree = activeSubscriptions.some(sub => sub.subscription_type === 'free');
  const hasAnySubscription = activeSubscriptions.length > 0;

  const hasAccess = (feature: Feature): boolean => {
    // Premium users have access to everything
    if (hasPremium) return true;

    // Free users only have access to specific features
    if (hasFree || hasAnySubscription) {
      return FREE_FEATURES.includes(feature);
    }

    // No subscription - no access
    return false;
  };

  return {
    hasAccess,
    hasPremiumAccess: hasPremium,
    hasAnySubscription,
    loading,
  };
}
