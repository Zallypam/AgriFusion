import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '../lib/supabase';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CloudSun,
  Microscope,
  Leaf,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck // Added ShieldCheck import
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
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

  const features = [
    {
      icon: ShieldCheck, // New feature
      title: "Quality Checking",
      description: "AI-powered product quality assessment with grading and market value estimation",
      color: "from-green-500 to-emerald-400",
      link: "QualityChecking"
    },
    {
      icon: TrendingUp,
      title: "Market Advisor",
      description: isFarmer
        ? "Get optimal selling prices based on market trends and weather conditions"
        : "Find fair buying prices and best purchase timing with AI insights",
      color: "from-emerald-500 to-teal-400",
      link: "MarketAdvisor"
    },
    {
      icon: ShoppingBag,
      title: "AgriMarket",
      description: isFarmer
        ? "List and sell your agricultural products to buyers across Kenya"
        : "Browse and purchase quality agricultural products from verified farmers",
      color: "from-purple-500 to-pink-400",
      link: "Marketplace"
    },
    {
      icon: MessageSquare,
      title: "AgriBot Assistant",
      description: "24/7 AI chatbot for all your farming and buying questions",
      color: "from-indigo-500 to-blue-400",
      link: "AgriBot"
    }
  ];

  const stats = [
    { icon: Users, label: "Active Users", value: "5,000+", color: "text-green-600" }, // Updated label
    { icon: TrendingUp, label: "Market Listings", value: "12,000+", color: "text-blue-600" },
    { icon: Zap, label: "Quality Checks", value: "25,000+", color: "text-purple-600" } // Updated label
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-green-50 opacity-50" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-6">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Powered by AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Smart Quality.
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Markets.
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                Smart Africa.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              {user ? (
                <>Welcome back, <span className="font-semibold text-green-600">{user.full_name || (isFarmer ? 'Farmer' : 'Buyer')}</span>! 👋</>
              ) : (
                "Empowering African agriculture with AI-driven quality checks and market intelligence."
              )}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl(isFarmer ? "QualityChecking" : "Marketplace")}>
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8 py-6 text-lg border-2 border-green-500 hover:bg-green-50"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
                >
                  Join Now
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color}`} />
                    <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                    <p className="text-gray-600">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Smart Agriculture
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              {isFarmer
                ? "AI-powered tools designed for modern African farmers"
                : isBuyer
                  ? "Smart buying tools for agricultural products"
                  : "Intelligent solutions for the agricultural value chain"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8"> {/* Changed lg:grid-cols-3 to md:grid-cols-2 as there are 4 features now */}
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(feature.link)}>
                  <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-green-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <div className="flex items-center text-green-600 font-medium group-hover:gap-3 transition-all">
                        Explore <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your {isFarmer ? 'Farm' : 'Business'}?
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands already using AgriFusion AI Lite
          </p>
          {!user ? (
            <Button
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 rounded-xl px-12 py-6 text-lg shadow-xl"
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
            >
              Sign Up Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Link to={createPageUrl(isFarmer ? "QualityChecking" : "Marketplace")}>
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 rounded-xl px-12 py-6 text-lg shadow-xl">
                Start Using Tools
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">AgriFusion AI</h3>
              <p className="text-gray-400 text-sm">
                Empowering African farmers with intelligent agricultural solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Quality Checking</li> {/* Updated feature list */}
                <li>Market Advisor</li>
                <li>AgriMarket</li>
                <li>AgriBot Assistant</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About CODEXA</li>
                <li>SwizFusion Tech</li>
                <li>Contact Us</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Twitter</li>
                <li>Facebook</li>
                <li>LinkedIn</li>
                <li>Instagram</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 AgriFusion AI Lite by CODEXA. Powered by SwizFusion Technologies.</p>
            <p className="mt-2">Smart Quality. Smart Markets. Smart Africa.</p> {/* Updated tagline */}
          </div>
        </div>
      </footer>
    </div>
  );
}
