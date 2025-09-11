import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
  id: string;
  user_id: string;
  subject_id: string;
  subscription_type: 'free' | 'premium';
  status: 'active' | 'inactive' | 'expired';
  started_at: string;
  expires_at?: string;
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
    fetchSubjects();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data as Subscription[] || []);
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

      const expiresAt = subscriptionType === 'premium' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        : undefined;

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          subscription_type: subscriptionType,
          status: 'active',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => [data as Subscription, ...prev]);
      toast({
        title: "Success",
        description: `Successfully subscribed to ${subscriptionType} plan`,
      });

      return data;
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

  const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => 
        prev.map(sub => sub.id === subscriptionId ? data as Subscription : sub)
      );

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
    try {
      const { data, error } = await supabase.rpc('check_subscription_status', {
        p_subject_id: subjectId
      });

      if (error) throw error;
      return data || 'none';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return 'none';
    }
  };

  const getActiveSubscription = (subjectId: string) => {
    return subscriptions.find(sub => 
      sub.subject_id === subjectId && 
      sub.status === 'active' &&
      (!sub.expires_at || new Date(sub.expires_at) > new Date())
    );
  };

  return {
    subscriptions,
    subjects,
    loading,
    createSubscription,
    updateSubscription,
    checkSubscriptionStatus,
    getActiveSubscription,
    fetchSubscriptions,
  };
}