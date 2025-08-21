import { useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Store,
  Star,
  ShoppingBag,
} from "lucide-react";

const navigationConfig = {
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Stores", url: "/admin/stores", icon: Store },
    { title: "Ratings", url: "/admin/ratings", icon: Star },
  ],
  store_owner: [
    { title: "Dashboard", url: "/owner/dashboard", icon: LayoutDashboard },
    { title: "My Stores", url: "/owner/stores", icon: ShoppingBag },
  ],
  user: [
    { title: "Browse Stores", url: "/stores", icon: Store },
    { title: "My Ratings", url: "/my/ratings", icon: Star },
  ],
};

export function AppSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();

  if (!profile) return null;

  const items = navigationConfig[profile.role] || [];
  const isCollapsed = state === "collapsed";

  const getNavLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200
     ${isCollapsed ? "justify-center" : ""}
     ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`;

  return (
    <aside
      className={`
        sticky top-14 h-[calc(100vh-3.5rem)] overflow-auto
        ${isCollapsed ? "w-20" : "w-64"}
        bg-white text-gray-900 border-l border-gray-200 shadow-sm
        transition-all duration-300
        ml-auto
      `}
    >
      <nav className="flex flex-col h-full space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={getNavLinkClasses}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
