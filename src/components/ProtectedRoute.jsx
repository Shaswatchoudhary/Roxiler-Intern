import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const from = location.pathname + location.search;
        navigate("/auth", { state: { from } });
        return;
      }

      if (!profile) {
        navigate("/profile-setup");
        return;
      }

      if (location.pathname === "/") {
        if (profile.role === "admin") {
          navigate("/admin/dashboard");
        } else if (profile.role === "store_owner") {
          navigate("/owner/dashboard");
        } else if (profile.role === "user") {
          navigate("/stores");
        }
        return;
      }

      if (roles && !roles.includes(profile.role)) {
        return;
      }
    }
  }, [user, profile, loading, navigate, roles, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (roles && !roles.includes(profile.role)) {
    const getUserLandingPage = () => {
      if (profile.role === "admin") return "/admin/dashboard";
      if (profile.role === "store_owner") return "/owner/dashboard";
      return "/stores";
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => navigate(getUserLandingPage())}
              className="w-full"
            >
              Go to Your Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>; //the children are the components that are protected when the user is authenticated
}
