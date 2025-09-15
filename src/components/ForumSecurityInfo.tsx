import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, UserCheck, Lock } from "lucide-react";

export function ForumSecurityInfo() {
  return (
    <Card className="mb-6 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Shield className="h-5 w-5" />
          Privacy Protected Forum
        </CardTitle>
        <CardDescription>
          Your privacy is our priority. Here's how we protect student identities in the forum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Eye className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Anonymous Display</h4>
              <p className="text-sm text-muted-foreground">
                Your questions and answers are shown with anonymous IDs like "Student #1234" to protect your identity.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <UserCheck className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Your Content Marked</h4>
              <p className="text-sm text-muted-foreground">
                You can still see which questions and answers are yours - they'll show as "You" instead of anonymous.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Secure Data</h4>
              <p className="text-sm text-muted-foreground">
                No personal information is exposed. Only teachers can see student details for educational purposes.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Safe Learning</h4>
              <p className="text-sm text-muted-foreground">
                Ask questions freely without worrying about judgment - your academic struggles remain private.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-accent border-accent/20">
              <Shield className="h-3 w-3 mr-1" />
              Privacy First
            </Badge>
            <span className="text-sm text-muted-foreground">
              Updated security measures ensure student privacy while maintaining educational value.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}