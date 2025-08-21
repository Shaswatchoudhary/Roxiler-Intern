import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardWidget({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
  children,
  variant = "default",
}) {
  const getChangeColor = (type) => {
    switch (type) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getCardVariant = (variant) => {
    switch (variant) {
      case "stats":
        return "card-stats";
      case "action":
        return "card-action";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("stat-card", getCardVariant(variant), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {children || (
          <>
            <div className="stat-value">{value}</div>
            {change && (
              <div className={cn("stat-change", getChangeColor(changeType))}>
                {change}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SearchBox({ placeholder = "Search...", className, ...props }) {
  return (
    <div className={cn("search-box", className)}>
      <input
        type="text"
        placeholder={placeholder}
        className="search-input"
        {...props}
      />
      <svg
        className="search-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

export function StatusBadge({ status, children, className }) {
  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "pending":
        return "status-pending";
      case "inactive":
        return "status-inactive";
      default:
        return "status-inactive";
    }
  };

  return (
    <span className={cn("status-badge", getStatusClass(status), className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("empty-state", className)}>
      {Icon && <Icon className="empty-state-icon" />}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && action}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={cn("progress-bar", className)}>
      <div
        className="progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
