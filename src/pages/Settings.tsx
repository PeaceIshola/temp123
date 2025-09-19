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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shield, Lock, KeyRound, ChevronDown, ChevronUp } from "lucide-react";
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
  
  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Collapsible states
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
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
            {/* Profile Information Card */}
            <Card>
              <Collapsible open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </div>
                      {isProfileOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-left">
                      Update your personal information and preferences
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
            </Card>

            {/* Security Settings Card */}
            <Card>
              <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Security Settings
                      </div>
                      {isSecurityOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-left">
                      Manage your account security and password
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                {/* Change Password Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Change Password</h3>
                  </div>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        minLength={6}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </form>
                </div>

                {/* Password Reset Section */}
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Forgot Your Password?</h3>
                      <p className="text-sm text-muted-foreground">
                        If you can't remember your current password, you can request a password reset email.
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handlePasswordReset}
                      disabled={isResettingPassword}
                      className="w-full"
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Reset Email...
                        </>
                      ) : (
                        'Send Password Reset Email'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;