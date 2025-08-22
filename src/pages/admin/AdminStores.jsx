import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/StarRating";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchStores();
  }, [currentPage, search, ratingFilter, sortField, sortDirection]);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("stores").select(
        `
          *,
          profiles!stores_owner_id_fkey(name, email)
        `,
        { count: "exact" }
      );

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,address.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (ratingFilter !== "all") {
        const minRating = parseFloat(ratingFilter);
        query = query
          .gte("average_rating", minRating)
          .lt("average_rating", minRating + 1);
      }

      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setStores(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stores");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRatingFilterChange = (value) => {
    setRatingFilter(value);
    setCurrentPage(1);
  };

  const SortButton = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <SortAsc className="ml-1 h-3 w-3 text-slate-500" />
          ) : (
            <SortDesc className="ml-1 h-3 w-3 text-slate-500" />
          ))}
      </span>
    </Button>
  );

  if (error) {
    return (
      <div className="space-y-6 p-6 bg-white min-h-screen">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100">
            <Store className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Store Management</h1>
            <p className="text-sm text-gray-600">Manage all platform stores</p>
          </div>
        </div>

        <Card className="border border-red-300 bg-red-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-600 font-medium">Error loading stores</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button onClick={fetchStores} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">
          Store Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage all platform stores
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border border-gray-300 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="search-box flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search stores by name, address, or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>

            <Select
              value={ratingFilter}
              onValueChange={handleRatingFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-300">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card className="bg-white border border-gray-300 shadow-sm">
        <CardHeader className="border-b border-gray-300">
          <CardTitle className="text-lg font-semibold text-black">
            Stores ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px] rounded bg-gray-200" />
                      <Skeleton className="h-3 w-[300px] rounded bg-gray-200" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded bg-gray-200" />
                    <Skeleton className="h-6 w-16 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : stores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No stores found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead>
                      <SortButton field="name">Store Name</SortButton>
                    </TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>
                      <SortButton field="average_rating">Rating</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="ratings_count">Reviews</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="created_at">Created</SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id} className="hover:bg-gray-100">
                      <TableCell className="font-medium text-black">{store.name}</TableCell>
                      <TableCell className="text-gray-500">{store.profiles?.name || "Unknown"}</TableCell>
                      <TableCell className="text-gray-500">{store.email}</TableCell>
                      <TableCell className="text-gray-500 max-w-[200px] truncate">{store.address}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating value={store.average_rating || 0} readonly size="sm" />
                          <span className="text-sm text-gray-500">{(store.average_rating || 0).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-200">{store.ratings_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{new Date(store.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-white border border-gray-300 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                stores
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm font-medium px-3">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
