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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Ticket, 
  Plus, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Shield,
  Settings,
  RefreshCw
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  grade_level: number | null;
  school_name: string | null;
  bio: string | null;
  created_at: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'account' | 'content' | 'security';
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  high_priority_tickets: number;
}

const AdminDashboard = () => {
  const { user, refreshSession } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [isTeacherOrAdmin, setIsTeacherOrAdmin] = useState(false);
  const [students, setStudents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [overviewCounts, setOverviewCounts] = useState({ studentCount: 0, teacherCount: 0, ticketCount: 0 });
  
  // Collapsible states
  const [isStudentsOpen, setIsStudentsOpen] = useState(true);
  const [isTeachersOpen, setIsTeachersOpen] = useState(false);
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);
  
  // Form states
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const
  });

  // Check if user is teacher/admin
  useEffect(() => {
    checkUserRole();
  }, [user]);

  // Load data when teacher/admin role is confirmed
  useEffect(() => {
    if (isTeacherOrAdmin) {
      loadAdminData();
    }
  }, [isTeacherOrAdmin]);

  const checkUserRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      const isAuthorized = profile?.role === 'teacher' || profile?.role === 'admin';
      setIsTeacherOrAdmin(isAuthorized);
      
      if (!isAuthorized) {
        toast({
          title: "Access Denied",
          description: "You need teacher or admin privileges to access this page",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      toast({
        title: "Error",
        description: "Failed to verify access permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1) Get overview counts first
      try {
        const { data: countsData, error: countsError } = await supabase
          .rpc('get_admin_overview_counts');

        if (countsError) throw countsError;
        
        const counts = countsData as { studentCount: number; teacherCount: number; ticketCount: number };
        setOverviewCounts({
          studentCount: counts?.studentCount || 0,
          teacherCount: counts?.teacherCount || 0,
          ticketCount: counts?.ticketCount || 0
        });
      } catch (err) {
        console.error('Overview counts fetch failed:', err);
        setOverviewCounts({ studentCount: 0, teacherCount: 0, ticketCount: 0 });
      }

      // 2) Students detailed data
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .rpc('get_student_list_for_teacher');

        if (studentsError) throw studentsError;

        if (studentsData && studentsData.length > 0) {
          const transformedStudents = studentsData.map((student: any, i: number) => ({
            id: `student-${i}`,
            user_id: `student-${i}`,
            full_name: student.student_name,
            first_name: student.student_name?.split(' ')[0] || '',
            last_name: student.student_name?.split(' ').slice(1).join(' ') || '',
            username: null,
            grade_level: student.grade_level,
            school_name: student.school_name,
            role: 'student',
            email: `s***@example.com`,
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setStudents(transformedStudents);
        } else {
          // If no detailed data, create placeholder entries based on count
          const placeholderStudents = Array(overviewCounts.studentCount || 0).fill(null).map((_, i) => ({
            id: `student-${i}`,
            user_id: `student-${i}`,
            full_name: `Student ${i + 1}`,
            first_name: `Student`,
            last_name: `${i + 1}`,
            username: null,
            grade_level: Math.floor(Math.random() * 12) + 1,
            school_name: 'Unknown School',
            role: 'student',
            email: 's***@example.com',
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setStudents(placeholderStudents);
        }
      } catch (err) {
        console.error('Students detailed fetch failed:', err);
        setStudents([]);
      }

      // 3) Teachers detailed data
      try {
        const { data: teachersData, error: teachersError } = await supabase
          .rpc('get_teachers_for_admin');

        if (teachersError) throw teachersError;

        if (teachersData && teachersData.length > 0) {
          const transformedTeachers = teachersData.map((teacher: any) => ({
            id: teacher.teacher_id,
            user_id: teacher.teacher_id,
            full_name: teacher.full_name,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            username: null,
            grade_level: null,
            school_name: teacher.school_name,
            role: 'teacher',
            email: teacher.email,
            bio: null,
            created_at: teacher.created_at,
            updated_at: teacher.updated_at
          }));
          setTeachers(transformedTeachers);
        } else {
          // If no detailed data, create placeholder entries based on count
          const placeholderTeachers = Array(overviewCounts.teacherCount || 0).fill(null).map((_, i) => ({
            id: `teacher-${i}`,
            user_id: `teacher-${i}`,
            full_name: `Teacher ${i + 1}`,
            first_name: `Teacher`,
            last_name: `${i + 1}`,
            username: null,
            grade_level: null,
            school_name: 'Unknown School',
            role: 'teacher',
            email: 't***@example.com',
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setTeachers(placeholderTeachers);
        }
      } catch (err) {
        console.error('Teachers detailed fetch failed:', err);
        setTeachers([]);
      }

      // 4) Tickets list
      try {
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('admin_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (ticketsError) throw ticketsError;
        setTickets((ticketsData || []) as Ticket[]);
      } catch (err) {
        console.error('Tickets fetch failed:', err);
        setTickets([]);
      }

      // 5) Ticket stats
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_admin_ticket_stats');

        if (statsError) throw statsError;
        setTicketStats(statsData as unknown as TicketStats);
      } catch (err) {
        console.error('Ticket stats fetch failed:', err);
        setTicketStats(null);
      }

    } catch (error: any) {
      console.error('Error loading admin data (outer):', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load admin data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (profile: Profile) => {
    try {
      // Use RPC function for admin profile updates to bypass RLS restrictions
      const { error } = await supabase.rpc('update_profile_as_admin', {
        p_profile_id: profile.id,
        p_first_name: profile.first_name,
        p_last_name: profile.last_name,
        p_full_name: profile.full_name,
        p_username: profile.username,
        p_role: profile.role,
        p_grade_level: profile.grade_level,
        p_school_name: profile.school_name,
        p_bio: profile.bio
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      setEditingProfile(null);
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_profile_as_admin', {
        p_profile_id: profileId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile deleted successfully"
      });
      
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive"
      });
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !newTicket.title.trim() || !newTicket.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          category: newTicket.category,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket created successfully"
      });

      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
      
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive"
      });
    }
  };

  const handleTicketStatusUpdate = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('admin_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket status updated successfully"
      });
      
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'secondary';
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

  if (!user || !isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p className="text-muted-foreground mb-4">
                  You need teacher or admin privileges to access the admin dashboard.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  If your role was recently changed, try refreshing your session or logging out and back in.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshSession}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Session
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Re-login
                  </Button>
                </div>
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
        <div className="container max-w-7xl">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-hero bg-clip-text text-transparent">Admin Dashboard</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage users, tickets, and administrative tasks
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{overviewCounts.studentCount}</p>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{overviewCounts.teacherCount}</p>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{ticketStats?.open_tickets || 0}</p>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{ticketStats?.high_priority_tickets || 0}</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Students Management */}
            <Card>
              <Collapsible open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Student Management ({overviewCounts.studentCount})
                      </div>
                      {isStudentsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-left">
                      View and manage student profiles
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {student.email?.substring(0, 3) + '***@' + student.email?.split('@')[1] || 'N/A'}
                              </TableCell>
                              <TableCell>{student.grade_level || 'N/A'}</TableCell>
                              <TableCell>{student.school_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setEditingProfile(student)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Student Profile</DialogTitle>
                                      <DialogDescription>
                                        Update student information
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingProfile && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                              id="first_name"
                                              value={editingProfile.first_name || ''}
                                              onChange={(e) => setEditingProfile({
                                                ...editingProfile,
                                                first_name: e.target.value
                                              })}
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                              id="last_name"
                                              value={editingProfile.last_name || ''}
                                              onChange={(e) => setEditingProfile({
                                                ...editingProfile,
                                                last_name: e.target.value
                                              })}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label htmlFor="grade_level">Grade Level</Label>
                                          <Input
                                            id="grade_level"
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={editingProfile.grade_level || ''}
                                            onChange={(e) => setEditingProfile({
                                              ...editingProfile,
                                              grade_level: parseInt(e.target.value) || null
                                            })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="school_name">School Name</Label>
                                          <Input
                                            id="school_name"
                                            value={editingProfile.school_name || ''}
                                            onChange={(e) => setEditingProfile({
                                              ...editingProfile,
                                              school_name: e.target.value
                                            })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="role">Role</Label>
                                          <Select
                                            value={editingProfile.role || 'student'}
                                            onValueChange={(value) => setEditingProfile({
                                              ...editingProfile,
                                              role: value
                                            })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="student">Student</SelectItem>
                                              <SelectItem value="teacher">Teacher</SelectItem>
                                              <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button 
                                          onClick={() => handleProfileUpdate(editingProfile)}
                                          className="w-full"
                                        >
                                          Save Changes
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Teachers Management */}
            <Card>
              <Collapsible open={isTeachersOpen} onOpenChange={setIsTeachersOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Teacher Management ({overviewCounts.teacherCount})
                      </div>
                      {isTeachersOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-left">
                      View and manage teacher profiles
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                              <TableCell>
                                {teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'N/A'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {teacher.email?.substring(0, 3) + '***@' + teacher.email?.split('@')[1] || 'N/A'}
                              </TableCell>
                              <TableCell>{teacher.school_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={teacher.role === 'admin' ? 'default' : 'secondary'}>
                                  {teacher.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingProfile(teacher)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Ticket Management */}
            <Card>
              <Collapsible open={isTicketsOpen} onOpenChange={setIsTicketsOpen}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Ticket Management ({tickets.length})
                      </div>
                      {isTicketsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-left">
                      Manage support tickets and administrative tasks
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {/* Create New Ticket */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Ticket
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ticket_title">Title</Label>
                          <Input
                            id="ticket_title"
                            value={newTicket.title}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter ticket title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ticket_priority">Priority</Label>
                          <Select
                            value={newTicket.priority}
                            onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ticket_category">Category</Label>
                        <Select
                          value={newTicket.category}
                          onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="content">Content</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ticket_description">Description</Label>
                        <Textarea
                          id="ticket_description"
                          value={newTicket.description}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the issue or task..."
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleCreateTicket} className="w-full">
                        Create Ticket
                      </Button>
                    </div>

                    {/* Tickets List */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.title}</TableCell>
                              <TableCell>
                                <Badge variant={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{ticket.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={ticket.status}
                                  onValueChange={(value) => handleTicketStatusUpdate(ticket.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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

export default AdminDashboard;