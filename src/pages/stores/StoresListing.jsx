import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Mail, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/DashboardWidget";

export default function StoresListing() {
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetchStores();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      let query = supabase
        .from("stores")
        .select(`
          id,
          name,
          email,
          address,
          average_rating,
          ratings_count,
          owner:profiles!stores_owner_id_fkey(name, email)
        `);

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
        );
      }

      if (sortBy === "name") {
        query = query.order("name", { ascending: sortOrder === "asc" });
      } else if (sortBy === "rating") {
        query = query.order("average_rating", {
          ascending: sortOrder === "asc",
        });
      } else if (sortBy === "ratings_count") {
        query = query.order("ratings_count", {
          ascending: sortOrder === "asc",
        });
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load stores",
          variant: "destructive",
        });
      } else if (data) {
        const formattedStores = data.map((store) => {
          // If owner data is missing, use store email as fallback
          const ownerName = store.owner?.name || store.email.split('@')[0] || 'Store Owner';
          return {
            ...store,
            owner: {
              name: ownerName,
              ...store.owner
            }
          };
        });
        setStores(formattedStores);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="loading-skeleton">
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-responsive mb-2">Explore Stores</h1>
        <p className="text-muted">
          Discover and rate amazing stores in your area
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="search-box flex-1">
          <Search className="search-icon" />
          <Input
            placeholder="Search stores by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSort("name")}
            size="sm"
            className={sortBy === "name" ? "bg-primary text-white" : ""}
          >
            Name{getSortIcon("name")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSort("rating")}
            size="sm"
            className={sortBy === "rating" ? "bg-primary text-white" : ""}
          >
            Rating{getSortIcon("rating")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSort("ratings_count")}
            size="sm"
            className={
              sortBy === "ratings_count" ? "bg-primary text-white" : ""
            }
          >
            Reviews{getSortIcon("ratings_count")}
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted">
        {stores.length} store{stores.length !== 1 ? "s" : ""} found
      </div>

      {/* Stores Grid */}
      {stores.length === 0 ? (
        <EmptyState
          title="No stores found"
          description="Try adjusting your search terms or filters"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card
              key={store.id}
              className="card-action"
              onClick={() => (window.location.href = `/stores/${store.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {store.email}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {store.ratings_count} review
                    {store.ratings_count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-muted">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{store.address}</span>
                </div>

                <div className="flex items-center justify-between">
                  <StarRating
                    value={store.average_rating}
                    readonly
                    showValue
                    size="sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/stores/${store.id}`;
                    }}
                  >
                    View Store
                  </Button>
                </div>

                <div className="text-xs text-muted">
                  Managed by {store.owner.name} {/* Managed by {store.owner.name} with email {store.owner.email}  and we can see this in the database and on screen*/}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
