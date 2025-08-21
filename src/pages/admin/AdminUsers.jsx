import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RoleBadge } from "@/components/RoleBadge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, roleFilter, sortField, sortDirection]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("profiles").select("*", { count: "exact" });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const start = (currentPage - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
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

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
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
            <SortAsc className="ml-1 h-3 w-3 text-gray-500" />
          ) : (
            <SortDesc className="ml-1 h-3 w-3 text-gray-500" />
          ))}
      </span>
    </Button>
  );

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">
          User Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage all platform users
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border border-gray-300 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="search-box flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>

            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-300">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="store_owner">Store Owners</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border border-gray-300 shadow-sm">
        <CardHeader className="border-b border-gray-300">
          <CardTitle className="text-lg font-semibold text-black">
            Users ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px] bg-gray-200" />
                      <Skeleton className="h-3 w-[150px] bg-gray-200" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead>
                      <SortButton field="name">Name</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="email">Email</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="role">Role</SortButton>
                    </TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>
                      <SortButton field="created_at">Joined</SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-100">
                      <TableCell className="font-medium text-black">{user.name}</TableCell>
                      <TableCell className="text-gray-500">{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {user.address || "-"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
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
        <Card className="bg-white border border-gray-300 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                users
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
