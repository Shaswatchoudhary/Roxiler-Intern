import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Layout({ children }) {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface">
        <AppHeader />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface flex flex-col">
        <AppHeader />
        
        <div className="flex flex-1">
          <AppSidebar />
          
          <div className="flex-1 overflow-y-auto">
            <main className="p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
