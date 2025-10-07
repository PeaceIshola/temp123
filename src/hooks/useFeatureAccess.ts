import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "./useUserRole";
import { useSubscriptions } from "./useSubscriptions";

export type FeatureType = 
  | 'subjects' 
  | 'forum' 
  | 'solution-bank' 
  | 'homework-help' 
  | 'quizzes' 
  | 'flashcards' 
  | 'quick-help';

const FREE_FEATURES: FeatureType[] = ['subjects', 'forum', 'solution-bank'];

export const useFeatureAccess = () => {
  const { user } = useAuth();
  const { isTeacher, isAdmin, loading: rolesLoading } = useUserRole();
  const { userSubscription, loading: subscriptionLoading } = useSubscriptions();

  const hasAccess = (feature: FeatureType): boolean => {
    // Teachers and admins have full access
    if (isTeacher || isAdmin) {
      return true;
    }

    // Not authenticated
    if (!user) {
      return false;
    }

    // Free features are always accessible
    if (FREE_FEATURES.includes(feature)) {
      return true;
    }

    // Premium features require active subscription
    const hasActiveSubscription = userSubscription?.subscriptions?.some(
      (sub: any) => sub.status === 'active' && sub.subscription_type === 'premium'
    );

    return hasActiveSubscription || false;
  };

  const isPremiumFeature = (feature: FeatureType): boolean => {
    return !FREE_FEATURES.includes(feature);
  };

  return {
    hasAccess,
    isPremiumFeature,
    loading: rolesLoading || subscriptionLoading,
    isTeacher: isTeacher || isAdmin,
  };
};
