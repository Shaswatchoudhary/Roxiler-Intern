import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function AuthRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        const from =
          (location.state && location.state.from) ||
          getRoleLandingPage(profile.role);
        navigate(from, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location]);

  const getRoleLandingPage = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "store_owner":
        return "/owner/dashboard";
      case "user":
        return "/stores";
      default:
        return "/stores";
    }
  };

  if (loading || (user && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg font-medium">Redirecting...</span>
        </div>
      </div>
    );
  }

  return null;
}
