import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="max-w-4xl mx-auto px-4 pt-20 pb-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-black" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Discover & review local stores</h1>

        <p className="max-w-2xl mx-auto text-sm text-gray-700 mb-6">
          Find nearby shops, read real reviews and leave your rating. Simple, honest, local.
        </p>

        <div className="max-w-xl mx-auto">
          <Input
            readOnly
            onClick={() => navigate("/auth")}
            placeholder="Search for stores (sign in to search)"
            className="pl-4 h-12 rounded-md bg-white border border-gray-300 text-sm"
          />
        </div>

        <div className="mt-5">
          <Button
            onClick={() => navigate("/auth")}
            className="px-6 py-2 rounded-md bg-black text-white"
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-5 text-center">
              <h3 className="font-semibold mb-1 text-black">Find Stores</h3>
              <p className="text-sm text-gray-700">Browse local businesses near you.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-5 text-center">
              <h3 className="font-semibold mb-1 text-black">Read Reviews</h3>
              <p className="text-sm text-gray-700">See honest reviews from other shoppers.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-5 text-center">
              <h3 className="font-semibold mb-1 text-black">Share Experience</h3>
              <p className="text-sm text-gray-700">Leave ratings and help the community.</p>
            </CardContent>
          </Card>
        </section>

        {/* Simple stats */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">1,000+</div>
            <div className="text-sm text-gray-700">Stores Rated</div>
          </div>
          <div>
            <div className="text-2xl font-bold">50,000+</div>
            <div className="text-sm text-gray-700">Trusted Shoppers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">4.8★</div>
            <div className="text-sm text-gray-700">Average Rating</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
