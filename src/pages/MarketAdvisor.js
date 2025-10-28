import React, { useState } from "react";
import { base44 } from '../lib/supabase';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  MapPin,
  Package,
  CloudSun,
  BarChart3,
  Lightbulb,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Scale
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function MarketAdvisor() {
  const queryClient = useQueryClient();

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
  const isBuyer = user?.user_type === 'buyer';

  const [formData, setFormData] = useState({
    produce_type: "",
    location: user?.location || "",
    quantity: "",
    quality_grade: "",
    additional_notes: ""
  });

  const [analysis, setAnalysis] = useState(null);

  const { data: recentAnalyses } = useQuery({
    queryKey: ['marketTrends'],
    queryFn: () => base44.entities.MarketTrend.list('-created_date', 5),
    initialData: [],
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      // First, get current weather for the location
      const weatherPrompt = `Get current weather conditions for ${formData.location}, Kenya. Include temperature, rainfall, and any weather alerts that might affect agriculture.`;
      
      const weatherData = await base44.integrations.Core.InvokeLLM({
        prompt: weatherPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            current_weather: { type: "string" },
            temperature: { type: "number" },
            rainfall_recent: { type: "string" },
            weather_impact_on_farming: { type: "string" }
          }
        }
      });

      // Then, get comprehensive market analysis tailored to user type
      const userContext = isFarmer 
        ? "You are advising a FARMER who wants to SELL their produce. Focus on optimal selling strategies, when to sell, and how to maximize profits."
        : "You are advising a BUYER who wants to PURCHASE produce. Focus on best buying times, fair prices to offer, and quality to expect.";

      const marketPrompt = `${userContext}
      
      Analyze the current market conditions for ${formData.produce_type} in ${formData.location}, Kenya.
      
      Consider:
      1. Current market prices and trends
      2. Supply and demand dynamics
      3. Seasonal factors
      4. Weather impact: ${weatherData.weather_impact_on_farming}
      5. Quality grade: ${formData.quality_grade || 'standard'}
      6. Quantity: ${formData.quantity} ${formData.produce_type}
      7. Additional context: ${formData.additional_notes}
      8. User is a ${isFarmer ? 'SELLER/FARMER' : 'BUYER'}
      
      Provide:
      - Price range (minimum, optimal, maximum in KSh) - ${isFarmer ? 'selling prices' : 'buying prices'}
      - Current demand level (very_low, low, moderate, high, very_high)
      - Current supply level (very_low, low, moderate, high, very_high)
      - Price trend (falling, stable, rising)
      - Detailed market analysis from ${isFarmer ? 'seller' : 'buyer'} perspective
      - How weather is currently impacting prices
      - 5 specific actionable recommendations for the ${isFarmer ? 'farmer/seller' : 'buyer'}
      - Confidence score (0-100) in your price recommendation
      
      ${isFarmer ? 'Help the farmer get the best price for their produce.' : 'Help the buyer find fair prices and best buying opportunities.'}
      
      Be specific with Kenyan market prices and conditions.`;

      const marketData = await base44.integrations.Core.InvokeLLM({
        prompt: marketPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_price_min: { type: "number" },
            suggested_price_optimal: { type: "number" },
            suggested_price_max: { type: "number" },
            demand_level: { 
              type: "string",
              enum: ["very_low", "low", "moderate", "high", "very_high"]
            },
            supply_level: { 
              type: "string",
              enum: ["very_low", "low", "moderate", "high", "very_high"]
            },
            price_trend: {
              type: "string",
              enum: ["falling", "stable", "rising"]
            },
            market_analysis: { type: "string" },
            weather_impact: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            confidence_score: { type: "number" }
          }
        }
      });

      // Save the analysis
      const savedAnalysis = await base44.entities.MarketTrend.create({
        produce_type: formData.produce_type,
        location: formData.location,
        quantity: parseFloat(formData.quantity) || null,
        quality_grade: formData.quality_grade || "standard",
        ...marketData
      });

      return {
        ...marketData,
        weather: weatherData,
        id: savedAnalysis.id,
        created_date: savedAnalysis.created_date
      };
    },
    onSuccess: (data) => {
      setAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['marketTrends'] });
    },
  });

  const getDemandColor = (level) => {
    const colors = {
      very_low: "bg-red-100 text-red-800 border-red-300",
      low: "bg-orange-100 text-orange-800 border-orange-300",
      moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
      high: "bg-green-100 text-green-800 border-green-300",
      very_high: "bg-emerald-100 text-emerald-800 border-emerald-300"
    };
    return colors[level] || colors.moderate;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "rising": return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "falling": return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case "rising": return "text-green-600 bg-green-50";
      case "falling": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Smart Market Advisor
            {isFarmer && <span className="text-2xl ml-3 text-green-600">(Seller Mode)</span>}
            {isBuyer && <span className="text-2xl ml-3 text-blue-600">(Buyer Mode)</span>}
          </h1>
          <p className="text-gray-600">
            {isFarmer 
              ? "AI-powered pricing recommendations to help you sell at the best rates" 
              : "Smart buying advice to help you purchase quality produce at fair prices"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                  {isFarmer ? 'Get Selling Price Recommendation' : 'Get Buying Price Guide'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="produce">Produce Type *</Label>
                    <Input
                      id="produce"
                      value={formData.produce_type}
                      onChange={(e) => setFormData({ ...formData, produce_type: e.target.value })}
                      placeholder="e.g., Maize, Tomatoes, Milk"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Market Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Nairobi, Nakuru"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (Optional)</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="e.g., 100 kg"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quality">Quality Grade</Label>
                    <Select
                      value={formData.quality_grade}
                      onValueChange={(value) => setFormData({ ...formData, quality_grade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium / Grade A</SelectItem>
                        <SelectItem value="standard">Standard / Grade B</SelectItem>
                        <SelectItem value="economy">Economy / Grade C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                    placeholder="Any special conditions, organic certification, etc..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={!formData.produce_type || !formData.location || analyzeMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 py-6 text-lg"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      {isFarmer ? 'Get Selling Price' : 'Get Buying Price'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <AnimatePresence>
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-6"
                >
                  {/* Price Recommendation Card */}
                  <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-emerald-600" />
                          {isFarmer ? 'Recommended Selling Prices' : 'Fair Buying Price Range'}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          {analysis.confidence_score}% Confidence
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Price Range Visual */}
                      <div className="bg-white rounded-xl p-6 border-2 border-emerald-200">
                        <div className="grid grid-cols-3 gap-4 text-center mb-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              {isFarmer ? 'Minimum' : 'Budget Price'}
                            </p>
                            <p className="text-2xl font-bold text-gray-700">
                              KSh {analysis.suggested_price_min?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {isFarmer ? 'Floor price' : 'Lowest expected'}
                            </p>
                          </div>
                          <div className="border-x-2 border-emerald-200">
                            <p className="text-sm text-emerald-700 mb-2 font-semibold">
                              {isFarmer ? '✨ Optimal Selling' : '✨ Fair Market'}
                            </p>
                            <p className="text-4xl font-bold text-emerald-600">
                              KSh {analysis.suggested_price_optimal?.toLocaleString()}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">Recommended</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              {isFarmer ? 'Maximum' : 'Premium Price'}
                            </p>
                            <p className="text-2xl font-bold text-gray-700">
                              KSh {analysis.suggested_price_max?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {isFarmer ? 'Ceiling price' : 'High-quality'}
                            </p>
                          </div>
                        </div>

                        {/* Visual Price Range Bar */}
                        <div className="relative h-3 bg-gradient-to-r from-gray-300 via-emerald-400 to-gray-300 rounded-full">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-600 rounded-full border-4 border-white shadow-lg" />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{isFarmer ? 'Conservative' : 'Budget'}</span>
                          <span className="font-semibold text-emerald-600">Sweet Spot</span>
                          <span>{isFarmer ? 'Aggressive' : 'Premium'}</span>
                        </div>
                      </div>

                      {/* Confidence Meter */}
                      <div className="bg-white rounded-xl p-4 border border-emerald-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                          <span className="text-lg font-bold text-emerald-600">
                            {analysis.confidence_score}%
                          </span>
                        </div>
                        <Progress value={analysis.confidence_score} className="h-2" />
                        <p className="text-xs text-gray-500 mt-2">
                          {analysis.confidence_score >= 80 ? "High confidence - strong market data available" :
                           analysis.confidence_score >= 60 ? "Moderate confidence - fair market visibility" :
                           "Lower confidence - limited data, use as guideline"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Conditions */}
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scale className="w-6 h-6 text-blue-600" />
                        Market Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Price Trend */}
                        <div className={`p-4 rounded-xl ${getTrendColor(analysis.price_trend)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Price Trend</span>
                            {getTrendIcon(analysis.price_trend)}
                          </div>
                          <p className="text-xl font-bold capitalize">{analysis.price_trend}</p>
                        </div>

                        {/* Demand */}
                        <div className="p-4 rounded-xl bg-white border-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Demand</span>
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          </div>
                          <Badge className={`${getDemandColor(analysis.demand_level)} border text-sm`}>
                            {analysis.demand_level?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Supply */}
                        <div className="p-4 rounded-xl bg-white border-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Supply</span>
                            <ArrowDownRight className="w-5 h-5 text-orange-600" />
                          </div>
                          <Badge className={`${getDemandColor(analysis.supply_level)} border text-sm`}>
                            {analysis.supply_level?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Market Analysis */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                          <BarChart3 className="w-4 h-4" />
                          Market Analysis
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {analysis.market_analysis}
                        </p>
                      </div>

                      {/* Weather Impact */}
                      {analysis.weather_impact && (
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-900">
                            <CloudSun className="w-4 h-4" />
                            Weather Impact on Pricing
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {analysis.weather_impact}
                          </p>
                          {analysis.weather && (
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                              <span>Current: {analysis.weather.current_weather}</span>
                              <span>•</span>
                              <span>Temp: {analysis.weather.temperature}°C</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-purple-600" />
                        Actionable Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {analysis.recommendations?.map((rec, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                          >
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">{i + 1}</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{rec}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Analyses Sidebar */}
          <div>
            <Card className="border-none shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[700px] overflow-y-auto">
                  {recentAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        No analyses yet. Get your first price recommendation!
                      </p>
                    </div>
                  ) : (
                    recentAnalyses.map((trend) => (
                      <div
                        key={trend.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setAnalysis(trend)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{trend.produce_type}</h4>
                          {getTrendIcon(trend.price_trend)}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{trend.location}</span>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-2 mb-2">
                          <p className="text-xs text-gray-600 mb-1">Optimal Price:</p>
                          <p className="text-lg font-bold text-emerald-600">
                            KSh {trend.suggested_price_optimal?.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-xs">
                            {trend.confidence_score}% confident
                          </Badge>
                          <span className="text-gray-400">
                            {format(new Date(trend.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
