import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Store, Star, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// The AdminDashboard component fetches and displays key metrics
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStoreOwners: 0,
    totalStores: 0,
    totalRatings: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersResult, storeOwnersResult, storesResult, ratingsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "user"),
          supabase
            .from("profiles")
            .select("id", { count: "exact" })
            .eq("role", "store_owner"),
          supabase.from("stores").select("id", { count: "exact" }),
          supabase.from("ratings").select("score"),
        ]);

      const totalRatings = ratingsResult.data?.length || 0;
      const averageRating =
        totalRatings > 0
          ? ratingsResult.data.reduce((sum, rating) => sum + rating.score, 0) /
            totalRatings
          : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalStoreOwners: storeOwnersResult.count || 0,
        totalStores: storesResult.count || 0,
        totalRatings,
        averageRating,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered customers",
    },
    {
      title: "Store Owners",
      value: stats.totalStoreOwners.toLocaleString(),
      icon: UserCheck,
      description: "Active store owners",
    },
    {
      title: "Total Stores",
      value: stats.totalStores.toLocaleString(),
      icon: Store,
      description: "Listed stores",
    },
    {
      title: "Total Ratings",
      value: stats.totalRatings.toLocaleString(),
      icon: Star,
      description: `Avg: ${stats.averageRating.toFixed(1)}★`,
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Skeleton className="h-8 w-64 rounded-md bg-gray-200" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex-1 p-6 bg-white border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="flex items-center justify-between p-0 mb-3">
                <Skeleton className="h-4 w-28 bg-gray-200" />
              </CardHeader>
              <CardContent className="p-0">
                <Skeleton className="h-8 w-28 rounded bg-gray-200 mb-2" />
                <Skeleton className="h-4 w-20 bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          A high-level overview of your platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card
            key={index}
            className="flex-1 p-6 bg-white border border-gray-300 rounded-lg shadow-sm"
          >
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-gray-100">
                  <card.icon className="h-6 w-6 text-black" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-800">
                  {card.title}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="text-4xl font-extrabold text-black">
                {card.value}
              </div>
              <p className="text-sm text-gray-500 mt-2">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
