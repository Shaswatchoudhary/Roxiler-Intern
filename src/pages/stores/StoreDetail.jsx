import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Star,
  MessageCircle,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreDetail() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState({ score: 0, comment: "" });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStoreDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchStoreDetail = async () => {
    if (!id) return;

    try {
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select(
          `
          id,
          name,
          email,
          address,
          average_rating,
          ratings_count,
          profiles!stores_owner_id_fkey (
            name
          )
        `
        )
        .eq("id", id)
        .single();

      if (storeError) throw storeError;

      setStore({
        ...storeData,
        owner: storeData.profiles || { name: "Unknown" },
      });

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select(
          `
          id,
          score,
          comment,
          created_at,
          profiles!ratings_user_id_fkey (
            name
          )
        `
        )
        .eq("store_id", id)
        .order("created_at", { ascending: false });

      if (ratingsError) throw ratingsError;

      setRatings(
        ratingsData?.map((rating) => ({
          ...rating,
          user: rating.profiles || { name: "Anonymous" },
        })) || []
      );

      if (user) {
        const { data: userRatingData } = await supabase
          .from("ratings")
          .select("id, score, comment")
          .eq("store_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        setUserRating(userRatingData);
        if (userRatingData) {
          setNewRating({
            score: userRatingData.score,
            comment: userRatingData.comment || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching store detail:", error);
      toast({
        title: "Error",
        description: "Failed to load store details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!user || !store || newRating.score === 0) return;

    setSubmitting(true);
    try {
      if (userRating) {
        const { error } = await supabase
          .from("ratings")
          .update({
            score: newRating.score,
            comment: newRating.comment || null,
          })
          .eq("id", userRating.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your rating has been updated",
        });
      } else {
        const { error } = await supabase.from("ratings").insert({
          store_id: store.id,
          user_id: user.id,
          score: newRating.score,
          comment: newRating.comment || null,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your rating has been submitted",
        });
      }

      setEditing(false);
      fetchStoreDetail();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("ratings")
        .delete()
        .eq("id", userRating.id);

      if (error) throw error;

      toast({ title: "Success", description: "Your rating has been deleted" });

      setUserRating(null);
      setNewRating({ score: 0, comment: "" });
      fetchStoreDetail();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rating",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    setEditing(true);
    if (userRating) {
      setNewRating({
        score: userRating.score,
        comment: userRating.comment || "",
      });
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    if (userRating) {
      setNewRating({
        score: userRating.score,
        comment: userRating.comment || "",
      });
    } else {
      setNewRating({ score: 0, comment: "" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-card/80 shadow-elevated border-primary/10">
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 rounded bg-muted/60" />
                  <Skeleton className="h-3 w-2/3 rounded bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Store not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{store.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Mail className="h-4 w-4" />
                    {store.email}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-4">
                  {store.ratings_count} review{store.ratings_count !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{store.address}</span>
              </div>

              <div className="flex items-center gap-4">
                <StarRating value={store.average_rating} readonly showValue size="lg" />
                <span className="text-sm text-muted-foreground">
                  Based on {store.ratings_count} review{store.ratings_count !== 1 ? "s" : ""}
                </span>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Managed by:</span> {store.owner.name}
              </div>
            </CardContent>
          </Card>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRating && !editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="star-wrapper text-yellow-500 inline-flex items-center">
                        <StarRating value={userRating.score} readonly />
                      </div>
                      <span className="font-medium text-slate-900">
                        {userRating.score}/5
                      </span>
                    </div>
                    {userRating.comment && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        "{userRating.comment}"
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={startEditing}>
                        Edit Rating
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteRating}
                        disabled={submitting}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete Rating
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>

                      {/* star + numeric badge (presentation only) */}
                      <div className="flex items-center gap-3">
                        <div className="star-wrapper text-yellow-500">
                          <StarRating
                            value={newRating.score}
                            onChange={(score) => setNewRating({ ...newRating, score })}
                            size="lg"
                          />
                        </div>

                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-sm font-semibold"
                          aria-live="polite"
                        >
                          {newRating.score}/5
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                      <Textarea
                        placeholder="Share your experience with this store..."
                        value={newRating.comment}
                        onChange={(e) => setNewRating({ ...newRating, comment: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleRatingSubmit} disabled={submitting || newRating.score === 0}>
                        {submitting ? "Submitting..." : userRating ? "Update Rating" : "Submit Rating"}
                      </Button>
                      {editing && (
                        <Button variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground mb-4">Sign in to rate this store and share your experience</p>
                <Button onClick={() => navigate("/auth")}>Sign In to Rate</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ratings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No reviews yet. Be the first to rate this store!</p>
              ) : (
                <div className="space-y-4">
                  {ratings.slice(0, 10).map((rating) => (
                    <div key={rating.id} className="space-y-2 pb-4 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{rating.user.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(rating.created_at), "MMM d, yyyy")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="star-wrapper text-yellow-400">
                          <StarRating value={rating.score} readonly size="sm" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{rating.score}/5</span>
                      </div>

                      {rating.comment && <p className="text-sm text-muted-foreground">"{rating.comment}"</p>}
                    </div>
                  ))}

                  {ratings.length > 10 && <p className="text-xs text-muted-foreground text-center pt-2">Showing 10 of {ratings.length} reviews</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
