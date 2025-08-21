import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import './App.css';
// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStores from "./pages/admin/AdminStores";
import AdminRatings from "./pages/admin/AdminRatings";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerStores from "./pages/owner/OwnerStores";
import StoresListing from "./pages/stores/StoresListing";
import StoreDetail from "./pages/stores/StoreDetail";
import MyRatings from "./pages/user/MyRatings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminStores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ratings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminRatings />
                  </ProtectedRoute>
                }
              />

              {/* Store Owner Routes */}
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute roles={["store_owner", "admin"]}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/stores"
                element={
                  <ProtectedRoute roles={["store_owner", "admin"]}>
                    <OwnerStores />
                  </ProtectedRoute>
                }
              />

              {/* User Routes */}
              <Route
                path="/stores"
                element={
                  <ProtectedRoute roles={["user", "store_owner", "admin"]}>
                    <StoresListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:id"
                element={
                  <ProtectedRoute roles={["user", "store_owner", "admin"]}>
                    <StoreDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my/ratings"
                element={
                  <ProtectedRoute roles={["user", "store_owner", "admin"]}>
                    <MyRatings />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
