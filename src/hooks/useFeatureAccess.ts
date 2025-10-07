import { useUserRole } from "./useUserRole";
import { useSubscriptions } from "./useSubscriptions";

export type FeatureName = 
  | 'subjects'
  | 'quizzes'
  | 'flashcards'
  | 'resources'
  | 'solution-bank'
  | 'forum'
  | 'homework-help'
  | 'quick-help'
  | 'student-dashboard';

// Features available to free users
const FREE_FEATURES: FeatureName[] = ['subjects', 'forum'];

export const useFeatureAccess = () => {
  const { isTeacher, isAdmin, loading: roleLoading } = useUserRole();
  const { getAllActiveSubscriptions, loading: subscriptionLoading } = useSubscriptions();

  const loading = roleLoading || subscriptionLoading;

  // Teachers and admins have access to everything
  const isTeacherOrAdmin = isTeacher || isAdmin;

  // Check if user has premium subscription
  const hasPremiumSubscription = () => {
    const subscriptions = getAllActiveSubscriptions();
    return subscriptions.some(sub => sub.subscription_type === 'premium');
  };

  // Check if feature is available for free users
  const isFreeFeature = (feature: FeatureName) => {
    return FREE_FEATURES.includes(feature);
  };

  // Check if user has access to a specific feature
  const hasAccess = (feature: FeatureName): boolean => {
    // Teachers and admins always have access
    if (isTeacherOrAdmin) return true;

    // Free features are accessible to everyone
    if (isFreeFeature(feature)) return true;

    // Premium features require premium subscription
    return hasPremiumSubscription();
  };

  return {
    hasAccess,
    isFreeFeature,
    hasPremiumSubscription: hasPremiumSubscription(),
    isTeacherOrAdmin,
    loading
  };
};
