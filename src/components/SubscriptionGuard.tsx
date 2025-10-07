import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess, FeatureName } from "@/hooks/useFeatureAccess";

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: FeatureName;
}

export const SubscriptionGuard = ({ children, feature }: SubscriptionGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: featureLoading } = useFeatureAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || featureLoading) return;

    // If not authenticated, redirect to auth page
    if (!user) {
      navigate("/auth");
      return;
    }

    // If authenticated but doesn't have access, redirect to subscriptions
    if (!hasAccess(feature)) {
      navigate("/subscriptions");
    }
  }, [user, authLoading, featureLoading, hasAccess, feature, navigate]);

  // Show loading or nothing while checking
  if (authLoading || featureLoading) {
    return null;
  }

  // If user doesn't have access, don't render children (will redirect)
  if (!user || !hasAccess(feature)) {
    return null;
  }

  return <>{children}</>;
};
