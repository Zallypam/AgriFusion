import React, { useState } from "react";
import { base44 } from '../lib/supabase';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Award,
  TrendingUp,
  ShieldCheck,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function QualityChecking() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [productType, setProductType] = useState("crop");
  const [productName, setProductName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ['qualityReports'],
    queryFn: () => base44.entities.QualityReport.list('-created_date', 10),
    initialData: [],
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${productName || productType} product image for quality assessment. 
        
        Provide a comprehensive quality check including:
        1. Overall quality grade (premium, grade_a, grade_b, grade_c, or reject)
        2. Quality score out of 100
        3. Visual quality indicators (color, size, freshness, uniformity, etc.)
        4. Any defects or issues detected
        5. Market readiness (ready, needs_improvement, or not_ready)
        6. Specific recommendations for quality improvement
        7. Estimated price range based on this quality in Kenyan market (in KSh)
        8. Expected shelf life
        
        Be specific and practical for African agricultural markets.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            quality_grade: { 
              type: "string",
              enum: ["premium", "grade_a", "grade_b", "grade_c", "reject"]
            },
            quality_score: { type: "number" },
            visual_assessment: { 
              type: "array",
              items: { type: "string" }
            },
            defects_detected: {
              type: "array",
              items: { type: "string" }
            },
            market_readiness: {
              type: "string",
              enum: ["ready", "needs_improvement", "not_ready"]
            },
            recommendations: { type: "string" },
            estimated_price_range: { type: "string" },
            shelf_life: { type: "string" }
          }
        }
      });

      await base44.entities.QualityReport.create({
        product_type: productType,
        product_name: productName || productType,
        image_url: file_url,
        ...result
      });

      return result;
    },
    onSuccess: (data) => {
      setResult(data);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['qualityReports'] });
    },
  });

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'grade_a': return 'bg-green-100 text-green-800 border-green-200';
      case 'grade_b': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'grade_c': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeIcon = (grade) => {
    switch (grade) {
      case 'premium': return <Award className="w-5 h-5" />;
      case 'grade_a': return <CheckCircle2 className="w-5 h-5" />;
      case 'grade_b': return <ShieldCheck className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getReadinessColor = (readiness) => {
    switch (readiness) {
      case 'ready': return 'text-green-600 bg-green-50';
      case 'needs_improvement': return 'text-orange-600 bg-orange-50';
      case 'not_ready': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Product Quality Checking
          </h1>
          <p className="text-gray-600">AI-powered quality assessment for your agricultural products</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Upload Product for Quality Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={productType} onValueChange={setProductType}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="crop">Crops</TabsTrigger>
                    <TabsTrigger value="livestock">Livestock</TabsTrigger>
                    <TabsTrigger value="dairy">Dairy</TabsTrigger>
                    <TabsTrigger value="processed">Processed</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Tomatoes, Maize, Milk"
                  />
                </div>

                {!preview ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-green-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2">Upload Product Image</h3>
                      <p className="text-gray-500 mb-4">
                        Take or upload a clear photo of your product
                      </p>
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={preview} alt="Preview" className="w-full h-96 object-cover" />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-4 right-4"
                        onClick={() => {
                          setPreview(null);
                          setFile(null);
                          setResult(null);
                        }}
                      >
                        Change Image
                      </Button>
                    </div>

                    {!result && (
                      <Button
                        onClick={() => analyzeMutation.mutate()}
                        disabled={loading || !productName}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 py-6 text-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing Quality...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            Check Quality
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Results */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Quality Grade Card */}
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Quality Assessment</span>
                            <Badge className={`${getGradeColor(result.quality_grade)} border text-lg px-4 py-1`}>
                              {result.quality_grade?.toUpperCase().replace('_', ' ')}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Quality Score */}
                          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                {getGradeIcon(result.quality_grade)}
                                <div>
                                  <p className="text-sm text-gray-600">Quality Score</p>
                                  <p className="text-4xl font-bold text-green-600">
                                    {result.quality_score}/100
                                  </p>
                                </div>
                              </div>
                              <div className={`px-4 py-2 rounded-lg ${getReadinessColor(result.market_readiness)}`}>
                                <p className="text-xs font-medium">Market Status</p>
                                <p className="text-sm font-bold capitalize">
                                  {result.market_readiness?.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                                style={{ width: `${result.quality_score}%` }}
                              />
                            </div>
                          </div>

                          {/* Pricing */}
                          {result.estimated_price_range && (
                            <div className="bg-white rounded-xl p-4 border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <h4 className="font-semibold text-gray-800">Estimated Market Value</h4>
                              </div>
                              <p className="text-2xl font-bold text-green-600">
                                {result.estimated_price_range}
                              </p>
                              {result.shelf_life && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Shelf Life: {result.shelf_life}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Visual Assessment */}
                          {result.visual_assessment && result.visual_assessment.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Quality Indicators
                              </h4>
                              <div className="grid md:grid-cols-2 gap-2">
                                {result.visual_assessment.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-3 border">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Defects */}
                          {result.defects_detected && result.defects_detected.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                Issues Detected
                              </h4>
                              <div className="space-y-2">
                                {result.defects_detected.map((defect, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{defect}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {result.recommendations && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <h4 className="font-semibold mb-2 text-blue-900">
                                Improvement Recommendations
                              </h4>
                              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                                {result.recommendations}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports Sidebar */}
          <div>
            <Card className="border-none shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Quality Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {reports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      No quality checks yet. Upload a product image to get started!
                    </p>
                  ) : (
                    reports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {report.image_url && (
                            <img
                              src={report.image_url}
                              alt="Report"
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{report.product_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {report.product_type}
                              </Badge>
                              <Badge className={`text-xs ${getGradeColor(report.quality_grade)}`}>
                                {report.quality_grade?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Score: {report.quality_score}/100
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(report.created_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
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