import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Loader2 } from "lucide-react";

interface SecureRoleManagerProps {
  userId: string;
  currentRole: string;
  userName: string;
  onRoleChanged: () => void;
}

type AppRole = 'admin' | 'teacher' | 'student';

export const SecureRoleManager = ({ userId, currentRole, userName, onRoleChanged }: SecureRoleManagerProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole as AppRole);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      toast({
        title: "Error",
        description: "Please provide a reason (minimum 10 characters)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, revoke existing role if different
      if (currentRole !== selectedRole) {
        const { error: revokeError } = await supabase.rpc('revoke_user_role', {
          target_user_id: userId,
          role_to_revoke: currentRole as AppRole,
          revocation_reason: `Changing role from ${currentRole} to ${selectedRole}: ${reason}`
        });

        if (revokeError) {
          console.error('Error revoking role:', revokeError);
          throw revokeError;
        }
      }

      // Assign new role using secure function
      const { data, error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        new_role: selectedRole,
        assignment_reason: reason
      });

      if (error) {
        console.error('Error assigning role:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Role updated to ${selectedRole} for ${userName}`,
      });

      setIsOpen(false);
      setReason('');
      onRoleChanged();
    } catch (error: any) {
      console.error('Role assignment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Assign a new role to {userName}. This action will be logged for security audit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as AppRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current role: <span className="font-semibold">{currentRole}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Required)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this role change is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. This will be logged for security audit.
            </p>
          </div>

          {selectedRole === 'admin' && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Warning:</strong> Admin role grants full system access. Ensure this user requires administrative privileges.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssignRole} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
