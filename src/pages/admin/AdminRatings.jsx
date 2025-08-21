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
  Star,
  MessageSquare,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [commentFilter, setCommentFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchRatings();
  }, [
    currentPage,
    search,
    scoreFilter,
    commentFilter,
    sortField,
    sortDirection,
  ]);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("ratings").select(
        `
          *,
          user_profiles:profiles!ratings_user_id_fkey(name, email),
          stores!ratings_store_id_fkey(name, address)
        `,
        { count: "exact" }
      );

      if (search) {
        query = query.or(`comment.ilike.%${search}%`);
      }

      if (scoreFilter !== "all") {
        query = query.eq("score", parseInt(scoreFilter));
      }

      if (commentFilter === "with_comment") {
        query = query.not("comment", "is", null).neq("comment", "");
      } else if (commentFilter === "no_comment") {
        query = query.or("comment.is.null,comment.eq.");
      }

      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setRatings(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ratings");
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

  const handleScoreFilterChange = (value) => {
    setScoreFilter(value);
    setCurrentPage(1);
  };

  const handleCommentFilterChange = (value) => {
    setCommentFilter(value);
    setCurrentPage(1);
  };

  const SortButton = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <SortAsc className="ml-1 h-3 w-3" />
        ) : (
          <SortDesc className="ml-1 h-3 w-3" />
        ))}
    </Button>
  );

  const stats = [
    { title: "Total Ratings", value: totalCount, icon: Star },
    {
      title: "Avg Score",
      value: (
        ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length || 0
      ).toFixed(1),
      icon: TrendingUp,
    },
    {
      title: "With Comments",
      value: ratings.filter((r) => r.comment && r.comment.trim() !== "").length,
      icon: MessageSquare,
    },
    {
      title: "High Ratings",
      value: ratings.filter((r) => r.score >= 4).length,
      icon: Star,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Rating Management
            </h1>
            <p className="text-gray-500">Manage all platform ratings</p>
          </div>
        </div>
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600 font-medium">
              Error loading ratings: {error}
            </p>
            <Button onClick={fetchRatings} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Rating Management
        </h1>
        <p className="text-sm text-gray-500">Manage all platform ratings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex items-center gap-2">
              <stat.icon className="h-5 w-5 text-gray-500" />
              <div>
                <span className="text-xs text-gray-500">{stat.title}</span>
                <p className="text-xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search ratings by comment..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={scoreFilter} onValueChange={handleScoreFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={commentFilter}
              onValueChange={handleCommentFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by comment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="with_comment">With Comments</SelectItem>
                <SelectItem value="no_comment">No Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Ratings ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2 rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No ratings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton field="score">Rating</SortButton>
                    </TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>
                      <SortButton field="created_at">Date</SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((rating) => (
                    <TableRow key={rating.id} className="hover:bg-gray-50">
                      <TableCell>
                        <StarRating value={rating.score} readonly size="sm" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {rating.stores?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {rating.user_profiles?.name || "Anonymous"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-gray-500">
                        {rating.comment || "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </TableCell>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                ratings
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
