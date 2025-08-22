import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";


export default function MyRatings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterScore, setFilterScore] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRatings();
    }
  }, [user, searchTerm, sortBy, sortOrder, filterScore]);

  const fetchRatings = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("ratings")
        .select(
          `
          id,
          score,
          comment,
          created_at,
          stores!ratings_store_id_fkey (
            id,
            name,
            address
          )
        `
        )
        .eq("user_id", user.id);

      if (searchTerm) {
        query = query.ilike("stores.name", `%${searchTerm}%`);
      }
      if (filterScore !== null) {
        query = query.eq("score", filterScore);
      }
      if (sortBy === "store_name") {
        query = query.order("stores(name)", { ascending: sortOrder === "asc" });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === "asc" });
      }

      const { data, error } = await query;
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load your ratings",
          variant: "destructive",
        });
      } else {
        const formattedRatings =
          data?.map((rating) => ({
            ...rating,
            store: rating.stores || {
              id: "",
              name: "Unknown Store",
              address: "",
            },
          })) || [];
        setRatings(formattedRatings);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ratingId) => {
    try {
      const { error } = await supabase
        .from("ratings")
        .delete()
        .eq("id", ratingId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({ title: "Success", description: "Rating deleted successfully" });
      fetchRatings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rating",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white border border-gray-100 shadow-sm rounded-xl">
              <CardHeader className="p-4">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            My Ratings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all the ratings you've given to stores
          </p>
        </div>

      {/* controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border border-gray-200"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterScore === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterScore(null);
                setSortBy("created_at");
                setSortOrder("desc");
              }}
            >
              All Ratings
            </Button>

            {[1, 2, 3, 4, 5].map((score) => (
              <Button
                key={score}
                variant={filterScore === score ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterScore(score)}
              >
                {score} Star{score !== 1 ? "s" : ""}
              </Button>
            ))}
          </div>
        </div>

        {/* no ratings */}
        {ratings.length === 0 ? (
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl mt-6">
            <CardContent className="text-center py-12">
              <p className="text-sm text-slate-500 mb-4">
                {searchTerm || filterScore
                  ? "No ratings found matching your filters."
                  : "You haven't rated any stores yet."}
              </p>
              {!searchTerm && !filterScore && (
                <Button onClick={() => navigate("/stores")} className="bg-primary text-white">
                  Browse Stores to Rate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mt-6">
            {ratings.map((rating) => (
              <Card
                key={rating.id}
                className="bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {rating.store.name}
                        <button
                          type="button"
                          onClick={() => navigate(`/stores/${rating.store.id}`)}
                          className="inline-flex items-center p-1 text-slate-500 hover:text-slate-700"
                          aria-label="Open store"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-500 truncate">
                        {rating.store.address}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-100 text-slate-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">
                          {format(new Date(rating.created_at), "MMM d, yyyy")}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <StarRating value={rating.score} readonly />
                      <span className="text-sm font-medium text-slate-900">
                        {rating.score}/5
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/stores/${rating.store.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Rating</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete your rating for "
                              {rating.store.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(rating.id)}
                              className="bg-red-600 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {rating.comment && (
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded text-sm text-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">Your review</span>
                      </div>
                      <p className="whitespace-pre-wrap">"{rating.comment}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
