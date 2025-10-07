import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess, FeatureType } from "@/hooks/useFeatureAccess";
import { toast } from "@/hooks/use-toast";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: FeatureType;
}

export const SubscriptionGuard = ({ children, feature }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const { hasAccess, loading, isTeacher } = useFeatureAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Teachers bypass subscription checks
    if (isTeacher) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!hasAccess(feature)) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to premium to access this feature.",
        variant: "destructive",
      });
      navigate("/subscriptions");
    }
  }, [user, hasAccess, feature, loading, navigate, isTeacher]);

  if (loading) {
    return null;
  }

  // Teachers always have access
  if (isTeacher || hasAccess(feature)) {
    return <>{children}</>;
  }

  return null;
};
