import React, { useState } from "react";
import { base44 } from '../lib/supabase';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const isFarmer = user?.user_type === 'farmer';

  const { data: listings, isLoading } = useQuery({
    queryKey: ['marketListings'],
    queryFn: () => base44.entities.MarketListing.filter({ status: 'active' }, '-created_date'),
    initialData: [],
  });

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryColors = {
    crops: "bg-green-100 text-green-800",
    livestock: "bg-orange-100 text-orange-800",
    dairy: "bg-blue-100 text-blue-800",
    poultry: "bg-yellow-100 text-yellow-800",
    seeds: "bg-purple-100 text-purple-800",
    equipment: "bg-gray-100 text-gray-800",
    other: "bg-pink-100 text-pink-800"
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AgriMarket
              </h1>
              <p className="text-gray-600">
                {isFarmer ? 'Sell your agricultural products' : 'Browse quality agricultural products from farmers'}
              </p>
            </div>
            {isFarmer && (
              <Link to={createPageUrl("AddListing")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Listing
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-8 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="crops">Crops</TabsTrigger>
                  <TabsTrigger value="livestock">Livestock</TabsTrigger>
                  <TabsTrigger value="dairy">Dairy</TabsTrigger>
                  <TabsTrigger value="poultry">Poultry</TabsTrigger>
                  <TabsTrigger value="seeds">Seeds</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-20 text-center">
              <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-2 text-gray-600">
                {searchQuery || categoryFilter !== 'all' ? 'No products found' : 'No listings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isFarmer 
                  ? 'Be the first to list a product!' 
                  : user 
                    ? 'Check back soon for new products!'
                    : 'Login as a farmer to start selling'}
              </p>
              {isFarmer && (
                <Link to={createPageUrl("AddListing")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Listing
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                  {listing.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl">{listing.title}</h3>
                      <Badge className={categoryColors[listing.category]}>
                        {listing.category}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-green-600">
                        KSh {listing.price?.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal ml-1">
                          / {listing.unit}
                        </span>
                      </p>
                      {listing.quantity_available && (
                        <p className="text-sm text-gray-600 mt-1">
                          {listing.quantity_available} {listing.unit}(s) available
                        </p>
                      )}
                    </div>

                    {listing.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{listing.description}</p>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-700">
                        Seller: {listing.seller_name}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {listing.seller_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(`tel:${listing.seller_phone}`)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        )}
                        {listing.seller_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(`mailto:${listing.seller_email}`)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
