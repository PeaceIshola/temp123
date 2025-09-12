import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Crown, CreditCard } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subjects, subscriptions, loading: subscriptionsLoading, createSubscription } = useSubscriptions();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          bio: profile.bio,
          full_name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.full_name
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async (subjectId: string, type: 'free' | 'premium') => {
    try {
      await createSubscription(subjectId, type);
      toast({
        title: "Success",
        description: `Successfully subscribed to ${type} plan`
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to subscribe",
        variant: "destructive"
      });
    }
  };

  const getSubscriptionStatus = (subjectId: string) => {
    const subscription = subscriptions.find(sub => sub.subject_id === subjectId);
    return subscription?.subscription_type || 'none';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please sign in to access settings</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-hero bg-clip-text text-transparent">Settings</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your profile and subscription preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name || ''}
                          onChange={(e) => setProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                        placeholder="Choose a unique username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email || user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed here. Contact support to update your email.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <div>
                        <Badge variant={profile.role === 'teacher' ? 'default' : 'secondary'}>
                          {profile.role || 'student'}
                        </Badge>
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Subject Subscriptions
                  </CardTitle>
                  <CardDescription>
                    Manage your subscriptions for enhanced learning features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subjects.map((subject) => {
                        const status = getSubscriptionStatus(subject.id);
                        return (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: subject.color }}
                              >
                                {subject.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-medium">{subject.name}</h3>
                                <p className="text-sm text-muted-foreground">{subject.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={status === 'premium' ? 'default' : status === 'free' ? 'secondary' : 'outline'}
                              >
                                {status === 'none' ? 'Not subscribed' : status}
                              </Badge>
                              {status !== 'premium' && (
                                <Button
                                  size="sm"
                                  variant={status === 'none' ? 'default' : 'outline'}
                                  onClick={() => handleSubscribe(subject.id, status === 'none' ? 'free' : 'premium')}
                                >
                                  {status === 'none' ? 'Subscribe Free' : 'Upgrade to Premium'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;