import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubjectSubscription {
  subject_id: string;
  subscription_type: 'free' | 'premium';
  status: 'active' | 'inactive' | 'expired';
  started_at: string;
  expires_at?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  user_name?: string;
  subscriptions: SubjectSubscription[];
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  icon?: string;
}

export function useSubscriptions() {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
    fetchSubjects();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserSubscription(data ? {
        ...data,
        subscriptions: (data.subscriptions as unknown as SubjectSubscription[]) || []
      } as UserSubscription : null);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error", 
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subjectId: string, subscriptionType: 'free' | 'premium' = 'free') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to subjects",
          variant: "destructive",
        });
        return null;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const expiresAt = subscriptionType === 'premium' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const newSubscription: SubjectSubscription = {
        subject_id: subjectId,
        subscription_type: subscriptionType,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      if (userSubscription) {
        // Update existing record - add or update subscription in array
        const existingSubscriptions = userSubscription.subscriptions || [];
        const subIndex = existingSubscriptions.findIndex(s => s.subject_id === subjectId);
        
        let updatedSubscriptions;
        if (subIndex >= 0) {
          // Update existing subscription
          updatedSubscriptions = [...existingSubscriptions];
          updatedSubscriptions[subIndex] = newSubscription;
        } else {
          // Add new subscription
          updatedSubscriptions = [...existingSubscriptions, newSubscription];
        }

        const { data, error } = await supabase
          .from('subscriptions')
          .update({ subscriptions: updatedSubscriptions as any })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setUserSubscription(data ? {
          ...data,
          subscriptions: (data.subscriptions as unknown as SubjectSubscription[]) || []
        } as UserSubscription : null);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            user_name: profile?.full_name || 'User',
            subscriptions: [newSubscription] as any,
          })
          .select()
          .single();

        if (error) throw error;
        setUserSubscription(data ? {
          ...data,
          subscriptions: (data.subscriptions as unknown as SubjectSubscription[]) || []
        } as UserSubscription : null);
      }

      toast({
        title: "Success",
        description: `Successfully subscribed to ${subscriptionType} plan`,
      });

      return true;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSubscription = async (subjectId: string, updates: Partial<SubjectSubscription>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userSubscription) return null;

      const existingSubscriptions = userSubscription.subscriptions || [];
      const subIndex = existingSubscriptions.findIndex(s => s.subject_id === subjectId);
      
      if (subIndex < 0) {
        throw new Error('Subscription not found');
      }

      const updatedSubscriptions = [...existingSubscriptions];
      updatedSubscriptions[subIndex] = { ...updatedSubscriptions[subIndex], ...updates };

      const { data, error } = await supabase
        .from('subscriptions')
        .update({ subscriptions: updatedSubscriptions as any })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserSubscription(data ? {
        ...data,
        subscriptions: (data.subscriptions as unknown as SubjectSubscription[]) || []
      } as UserSubscription : null);

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
      return null;
    }
  };

  const checkSubscriptionStatus = async (subjectId: string) => {
    if (!userSubscription?.subscriptions) return 'none';
    
    const subscription = userSubscription.subscriptions.find(sub => 
      sub.subject_id === subjectId && 
      sub.status === 'active' &&
      (!sub.expires_at || new Date(sub.expires_at) > new Date())
    );

    return subscription ? subscription.subscription_type : 'none';
  };

  const getActiveSubscription = (subjectId: string): SubjectSubscription | undefined => {
    if (!userSubscription?.subscriptions) return undefined;
    
    return userSubscription.subscriptions.find(sub => 
      sub.subject_id === subjectId && 
      sub.status === 'active' &&
      (!sub.expires_at || new Date(sub.expires_at) > new Date())
    );
  };

  const getAllActiveSubscriptions = (): SubjectSubscription[] => {
    if (!userSubscription?.subscriptions) return [];
    
    return userSubscription.subscriptions.filter(sub => 
      sub.status === 'active' &&
      (!sub.expires_at || new Date(sub.expires_at) > new Date())
    );
  };

  return {
    userSubscription,
    subjects,
    loading,
    createSubscription,
    updateSubscription,
    checkSubscriptionStatus,
    getActiveSubscription,
    getAllActiveSubscriptions,
    fetchSubscriptions,
  };
}