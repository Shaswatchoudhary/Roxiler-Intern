import { Badge } from "@/components/ui/badge";
import { Shield, Store, User } from "lucide-react";

export function RoleBadge({ role, size = "md" }) {
  const config = {
    admin: {
      label: "Admin",
      variant: "admin",
      icon: Shield,
    },
    store_owner: {
      label: "Store Owner",
      variant: "store-owner",
      icon: Store,
    },
    user: {
      label: "User",
      variant: "user",
      icon: User,
    },
  };

  const { label, variant, icon: Icon } = config[role];
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className={iconSize} />
      {label}
    </Badge>
  );
}
