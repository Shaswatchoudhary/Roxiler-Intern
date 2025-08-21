import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

// This component handles the main application layout, including the header and sidebar.
// It conditionally renders a simplified layout for unauthenticated users.
export function Layout({ children }) {
  const { profile } = useAuth();

  // If there's no user profile, render a simple layout with just the AppHeader and the main content.
  if (!profile) {
    return (
      // The min-h-screen class ensures the container fills the entire viewport height.
      // bg-surface is a custom CSS variable for the background color.
      <div className="min-h-screen bg-surface">
        {/* The application header is now used for both authenticated and unauthenticated states. */}
        <AppHeader />
        {/* The main content area, which takes up the rest of the space */}
        <main>{children}</main>
      </div>
    );
  }

  // If the user is authenticated, render the full-featured application layout.
  return (
    <SidebarProvider>
      {/* The main container for the entire application, ensures full height */}
      <div className="min-h-screen bg-surface flex flex-col">
        {/* The application header, typically at the top of the screen */}
        <AppHeader />
        {/*
          This flex container holds the sidebar and the main content area.
          It uses 'flex' to align its children side-by-side.
        */}
        <div className="flex flex-1">
          {/* The sidebar, which is a fixed-width component */}
          <AppSidebar />
          {/*
            The main content area.
            'flex-1' makes this div expand to fill the available space.
            'overflow-y-auto' allows the main content to scroll independently.
          */}
          <div className="flex-1 overflow-y-auto">
            {/* The main content, which will be the pages rendered by the router */}
            <main className="p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
