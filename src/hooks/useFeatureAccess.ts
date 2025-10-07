import { useSubscriptions } from './useSubscriptions';
import { useUserRole } from './useUserRole';

// Features available to free subscribers
const FREE_FEATURES = ['subjects', 'forum', 'solution-bank'] as const;

// All features (premium gets everything)
const ALL_FEATURES = [
  'subjects',
  'forum',
  'solution-bank',
  'quizzes',
  'flashcards',
  'resources',
  'homework-help',
  'quick-help',
  'student-dashboard'
] as const;

type FeatureName = typeof ALL_FEATURES[number];

export const useFeatureAccess = () => {
  const { userSubscription, loading } = useSubscriptions();
  const { isTeacher, isAdmin } = useUserRole();

  const hasAccess = (feature: FeatureName): boolean => {
    // Teachers and admins have full access to all features
    if (isTeacher || isAdmin) {
      return true;
    }

    if (loading) return false;
    
    // Check if user has any active subscription
    const activeSubscriptions = userSubscription?.subscriptions?.filter(
      (sub: any) => sub.status === 'active'
    ) || [];

    if (activeSubscriptions.length === 0) {
      return false; // No active subscription
    }

    // Check if user has premium subscription
    const hasPremium = activeSubscriptions.some(
      (sub: any) => sub.subscription_type === 'premium'
    );

    if (hasPremium) {
      return true; // Premium users get all features
    }

    // Free users only get specific features
    return FREE_FEATURES.includes(feature as any);
  };

  const isPremiumFeature = (feature: FeatureName): boolean => {
    return !FREE_FEATURES.includes(feature as any);
  };

  return {
    hasAccess,
    isPremiumFeature,
    loading,
    FREE_FEATURES,
    ALL_FEATURES
  };
};
