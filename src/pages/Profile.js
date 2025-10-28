
import React, { useState } from "react";
import { base44 } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isFarmer = user?.user_type === 'farmer';
  const isBuyer = user?.user_type === 'buyer';

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    user_type: user?.user_type || "buyer", // Default to buyer if not set
    phone_number: user?.phone_number || "",
    location: user?.location || "",
    // Farmer fields
    farm_name: user?.farm_name || "",
    farm_type: user?.farm_type || "",
    farm_size: user?.farm_size || "",
    primary_crops: user?.primary_crops || [],
    // Buyer fields
    business_name: user?.business_name || "",
    purchase_interests: user?.purchase_interests || []
  });

  const [cropInput, setCropInput] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleAddCrop = () => {
    if (cropInput.trim() && !formData.primary_crops.includes(cropInput.trim())) {
      setFormData({
        ...formData,
        primary_crops: [...formData.primary_crops, cropInput.trim()]
      });
      setCropInput("");
    }
  };

  const handleRemoveCrop = (crop) => {
    setFormData({
      ...formData,
      primary_crops: formData.primary_crops.filter(c => c !== crop)
    });
  };

  const handleAddInterest = () => {
    if (cropInput.trim() && !formData.purchase_interests.includes(cropInput.trim())) {
      setFormData({
        ...formData,
        purchase_interests: [...formData.purchase_interests, cropInput.trim()]
      });
      setCropInput("");
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      purchase_interests: formData.purchase_interests.filter(i => i !== interest)
    });
  };

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        user_type: user.user_type || "buyer",
        phone_number: user.phone_number || "",
        location: user.location || "",
        farm_name: user.farm_name || "",
        farm_type: user.farm_type || "",
        farm_size: user.farm_size || "",
        primary_crops: user.primary_crops || [],
        business_name: user.business_name || "",
        purchase_interests: user.purchase_interests || []
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {isFarmer ? 'Farmer' : 'Buyer'} Profile
          </h1>
          <p className="text-gray-600">Manage your {isFarmer ? 'farm' : 'business'} information</p>
        </motion.div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6 text-green-600" />
              Personal & {isFarmer ? 'Farm' : 'Business'} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="user_type">I am a</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => setFormData({ ...formData, user_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer (Seller)</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.user_type === 'farmer' 
                  ? 'Farmers can sell products, check quality, and get selling advice'
                  : 'Buyers can browse products, get buying advice, and check quality'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Cannot be changed)</Label>
              <Input
                id="email"
                value={user?.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Nairobi, Kenya"
              />
            </div>

            {/* Farmer-specific fields */}
            {formData.user_type === 'farmer' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-700">Farm Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farm_name">Farm Name</Label>
                      <Input
                        id="farm_name"
                        value={formData.farm_name}
                        onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                        placeholder="Green Valley Farm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="farm_type">Farm Type</Label>
                      <Select
                        value={formData.farm_type}
                        onValueChange={(value) => setFormData({ ...formData, farm_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crops">Crops</SelectItem>
                          <SelectItem value="livestock">Livestock</SelectItem>
                          <SelectItem value="mixed">Mixed Farming</SelectItem>
                          <SelectItem value="poultry">Poultry</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="farm_size">Farm Size</Label>
                      <Input
                        id="farm_size"
                        value={formData.farm_size}
                        onChange={(e) => setFormData({ ...formData, farm_size: e.target.value })}
                        placeholder="e.g., 5 acres"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="crops">Primary Crops/Products</Label>
                    <div className="flex gap-2">
                      <Input
                        id="crops"
                        value={cropInput}
                        onChange={(e) => setCropInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCrop()}
                        placeholder="Add a crop/product and press Enter"
                      />
                      <Button type="button" onClick={handleAddCrop}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.primary_crops.map((crop, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                          onClick={() => handleRemoveCrop(crop)}
                        >
                          {crop} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Buyer-specific fields */}
            {formData.user_type === 'buyer' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-700">Buying Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business/Company Name (Optional)</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="ABC Trading Company"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interests">Products I Buy</Label>
                      <div className="flex gap-2">
                        <Input
                          id="interests"
                          value={cropInput} // Reusing cropInput for consistency, consider separate state for more complex forms
                          onChange={(e) => setCropInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                          placeholder="Add products you're interested in"
                        />
                        <Button type="button" onClick={handleAddInterest}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.purchase_interests.map((interest, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            onClick={() => handleRemoveInterest(interest)}
                          >
                            {interest} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={() => updateProfileMutation.mutate(formData)}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 py-6 text-lg"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
