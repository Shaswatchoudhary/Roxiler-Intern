import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Star, TrendingUp, MessageCircle } from "lucide-react";

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatings: 0,
    averageRating: 0,
    recentRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchOwnerStats();
    }
  }, [profile]);

  const fetchOwnerStats = async () => {
    if (!profile) return;

    try {
      const { data: stores } = await supabase
        .from("stores")
        .select("id, average_rating, ratings_count")
        .eq("owner_id", profile.id);

      if (stores) {
        const totalStores = stores.length;
        const totalRatings = stores.reduce(
          (sum, store) => sum + store.ratings_count,
          0
        );
        const averageRating =
          totalStores > 0
            ? stores.reduce(
                (sum, store) => sum + (store.average_rating || 0),
                0
              ) / totalStores
            : 0;

        const storeIds = stores.map((store) => store.id);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let recentRatings = 0;
        if (storeIds.length > 0) {
          const { count } = await supabase
            .from("ratings")
            .select("id", { count: "exact" })
            .in("store_id", storeIds)
            .gte("created_at", sevenDaysAgo.toISOString());
          recentRatings = count || 0;
        }

        setStats({ totalStores, totalRatings, averageRating, recentRatings });
      }
    } catch (error) {
      console.error("Error fetching owner stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "My Stores",
      value: stats.totalStores,
      icon: Store,
      description: "Stores you manage",
    },
    {
      title: "Total Ratings",
      value: stats.totalRatings,
      icon: Star,
      description: "Across all stores",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      icon: TrendingUp,
      description: "Overall performance",
    },
    {
      title: "Recent Reviews",
      value: stats.recentRatings,
      icon: MessageCircle,
      description: "Last 7 days",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Minimal header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Owner Dashboard</h1>
          <p className="text-sm text-gray-600">
            A quick overview of your stores and reviews.
          </p>
        </div>

        {/* Simple stat cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className="border bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-800">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900">
                  {card.value}
                </div>
                <CardDescription className="text-gray-600">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
