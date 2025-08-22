import { Badge } from "@/components/ui/badge";
import { Star, ShoppingBag, User2 } from "lucide-react";

export function RoleBadge({ role, size = "md" }) {
  // Configuration for roles with distinct icons
  const config = {
    admin: {
      label: "Admin",
      variant: "admin",
      icon: Star,
    },
    store_owner: {
      label: "Store Owner",
      variant: "store-owner",
      icon: ShoppingBag,
    },
    user: {
      label: "User",
      variant: "user",
      icon: User2,
    },
  };

  const { label, variant, icon: Icon } = config[role] || {};
  if (!Icon) return null; // fallback if role is invalid

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className={iconSize} />
      {label}
    </Badge>
  );
}
