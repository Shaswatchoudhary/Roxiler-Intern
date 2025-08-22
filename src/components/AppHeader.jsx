import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/RoleBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu } from "lucide-react"; 
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!profile) return null;

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/30 backdrop-blur-md border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger
              className="btn btn-ghost p-2 rounded-md text-slate-700 hover:bg-gray-100 flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" /> 
            </SidebarTrigger>

            <h1 className="text-lg font-bold text-slate-800">StoreRatings</h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full transition-all duration-150 hover:scale-105"
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-200 text-slate-900">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-white text-slate-900 shadow-md">
                <div className="flex items-center gap-3 p-3">
                  <div className="flex flex-col leading-none">
                    <span className="font-medium text-slate-900">{profile.name}</span>
                    <span className="text-sm text-slate-500 truncate w-44">{profile.email}</span>
                  </div>
                </div>

                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
