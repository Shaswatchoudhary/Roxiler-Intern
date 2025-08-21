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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Mail,
  ShoppingBag,
  Star as StarIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// A minimal StarRating component for a black & white theme
const MinimalStarRating = ({ value }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          className={`h-3 w-3 ${
            i < Math.floor(value) ? "text-black fill-black" : "text-gray-300 fill-transparent"
          }`}
        />
      ))}
    </div>
  );
};

export default function OwnerStores() {
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", address: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, searchTerm, sortBy, sortOrder]);

  const fetchStores = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase.from("stores").select("*").eq("owner_id", profile.id);
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
      const { data, error } = await query;
      if (error) {
        toast({ title: "Error", description: "Failed to load stores", variant: "destructive" });
      } else {
        setStores(data || []);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load stores", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name || data.name.length < 20 || data.name.length > 60) {
      errors.name = "Name must be between 20 and 60 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Valid email is required.";
    }
    if (!data.address || data.address.length > 400) {
      errors.address = "Address is required and must be under 400 characters.";
    }
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (editingStore) {
        const { error } = await supabase
          .from("stores")
          .update(formData)
          .eq("id", editingStore.id)
          .eq("owner_id", profile.id);
        if (error) throw error;
        toast({ title: "Success", description: "Store updated successfully." });
      } else {
        const { error } = await supabase
          .from("stores")
          .insert({ ...formData, owner_id: profile.id });
        if (error) throw error;
        toast({ title: "Success", description: "Store created successfully." });
      }
      resetForm();
      fetchStores();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save store.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (storeId) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId)
        .eq("owner_id", profile.id);
      if (error) throw error;
      toast({ title: "Success", description: "Store deleted successfully." });
      fetchStores();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete store.", variant: "destructive" });
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({ name: store.name || "", email: store.email || "", address: store.address || "" });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  const resetForm = () => {
    setEditingStore(null);
    setFormData({ name: "", email: "", address: "" });
    setFormErrors({});
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[180px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 border rounded border-black bg-white">
            <ShoppingBag className="h-4 w-4 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">My Stores</h1>
            <p className="text-sm text-gray-600">Manage your stores and basic info</p>
          </div>
        </div>

        <div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} className="bg-black text-white hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-1" />
                {editingStore ? "Edit Store" : "Add Store"}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[480px] bg-white rounded-lg border border-black p-4">
              <form onSubmit={handleFormSubmit}>
                <DialogHeader className="flex items-start gap-3 pb-2">
                  <div className="p-2 border rounded border-black bg-white">
                    <ShoppingBag className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <DialogTitle className="text-base text-black">
                      {editingStore ? "Edit Store" : "Create New Store"}
                    </DialogTitle>
                    <p className="text-xs text-gray-600 mt-1">Fill the fields below and save.</p>
                  </div>
                </DialogHeader>

                <div className="grid gap-3 py-3">
                  <div>
                    <Label htmlFor="name" className="text-sm text-black">Store Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="20–60 characters"
                      className={`bg-white border border-gray-400 text-black placeholder-gray-500 rounded ${formErrors.name ? "ring-1 ring-red-500" : ""}`}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm text-black">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="store@example.com"
                      className={`bg-white border border-gray-400 text-black placeholder-gray-500 rounded ${formErrors.email ? "ring-1 ring-red-500" : ""}`}
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm text-black">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Up to 400 characters"
                      className={`bg-white border border-gray-400 text-black placeholder-gray-500 rounded ${formErrors.address ? "ring-1 ring-red-500" : ""}`}
                    />
                    {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                  </div>
                </div>

                <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="px-3 py-2 rounded-md border border-gray-400 text-black bg-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-black hover:bg-gray-800 text-white">
                    {submitting ? "Saving..." : editingStore ? "Update Store" : "Create Store"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border border-gray-400 text-black"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSort("name")} size="sm" className="border-gray-400 text-black">Name{getSortIcon("name")}</Button>
          <Button variant="outline" onClick={() => handleSort("average_rating")} size="sm" className="border-gray-400 text-black">Rating{getSortIcon("average_rating")}</Button>
          <Button variant="outline" onClick={() => handleSort("ratings_count")} size="sm" className="border-gray-400 text-black">Reviews{getSortIcon("ratings_count")}</Button>
        </div>
      </div>

      {/* Empty state or grid */}
      {stores.length === 0 ? (
        <Card className="border border-gray-300">
          <CardContent className="text-center py-10">
            <p className="text-gray-500">{searchTerm ? "No stores found." : "You haven't created any stores yet."}</p>
            {!searchTerm && (
              <Button className="mt-3 bg-black text-white hover:bg-gray-800" onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Store
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="border border-gray-300">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate text-black">{store.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 truncate text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{store.email}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0 border border-black text-black">
                    {store.ratings_count ?? 0} review{(store.ratings_count ?? 0) !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{store.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 border rounded border-gray-400 bg-white">
                    <StarIcon className="h-3 w-3 text-black" />
                  </div>
                  <MinimalStarRating value={store.average_rating ?? 0} />
                  <span className="text-sm text-gray-600">({store.ratings_count ?? 0})</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(store)} className="flex-1 border-gray-400 text-black">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-gray-400 text-red-500 hover:text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-black">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-black">Delete Store</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-400 text-black">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(store.id)}
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
