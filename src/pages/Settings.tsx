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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shield } from "lucide-react";
import { useSecureProfiles } from "@/hooks/useSecureProfiles";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  bio: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  grade_level: number | null;
  school_name: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getSecureProfile, updateProfile } = useSecureProfiles();
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
      const secureProfileData = await getSecureProfile();
      if (secureProfileData) {
        // Include email from auth user for display (read-only)
        setProfile({
          ...secureProfileData,
          email: user.email
        });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information securely",
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
      const success = await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        bio: profile.bio,
        grade_level: profile.grade_level,
        school_name: profile.school_name
      });

      if (success) {
        // Refresh profile data after successful update
        await fetchProfile();
      }
    } finally {
      setSaving(false);
    }
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
              Manage your profile information
            </p>
          </div>

          <div className="space-y-6">
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Email is protected and cannot be changed here. Contact support to update your email.
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade_level">Grade Level</Label>
                      <Input
                        id="grade_level"
                        type="number"
                        min="1"
                        max="12"
                        value={profile.grade_level || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, grade_level: parseInt(e.target.value) || null} : null)}
                        placeholder="Enter your grade level"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school_name">School Name</Label>
                      <Input
                        id="school_name"
                        value={profile.school_name || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, school_name: e.target.value} : null)}
                        placeholder="Enter your school name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Maximum 500 characters)</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-muted-foreground">
                      {profile.bio ? profile.bio.length : 0}/500 characters
                    </p>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;