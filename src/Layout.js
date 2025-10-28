import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from './lib/supabase';
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  Sprout,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children }) {
  const location = useLocation();

  const { data: user, isLoading } = useQuery({
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

  // Navigation items based on user type
  const navigationItems = [
    { title: "Home", url: "Home", icon: Home, forAll: true },
    { title: "Quality Checking", url: "QualityChecking", icon: ShieldCheck, forFarmer: true },
    { title: "Market Advisor", url: "MarketAdvisor", icon: TrendingUp, forAll: true },
    { title: "AgriMarket", url: "Marketplace", icon: ShoppingBag, forAll: true },
    { title: "AgriBot", url: "AgriBot", icon: MessageSquare, forAll: true },
  ].filter(item => {
    if (!user) return item.forAll; // Show basic items for guests
    if (item.forAll) return true;
    if (item.forFarmer && isFarmer) return true;
    if (item.forBuyer && isBuyer) return true;
    return false;
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-green: #00B37E;
          --accent-blue: #007BFF;
          --bg-light: #F8FBF9;
          --text-dark: #1A2E1A;
        }
        
        body {
          background: linear-gradient(135deg, #F8FBF9 0%, #E8F5F0 100%);
        }
        
        .nav-link-active {
          background: linear-gradient(135deg, var(--primary-green), var(--accent-blue));
          color: white;
        }
        
        .brand-gradient {
          background: linear-gradient(135deg, var(--primary-green), var(--accent-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-green-100 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-green-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg brand-gradient">AgriFusion</h2>
                <p className="text-xs text-gray-500">AI Lite</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`mb-1 rounded-xl transition-all duration-300 hover:scale-105 ${
                          location.pathname === createPageUrl(item.url)
                            ? 'nav-link-active shadow-lg'
                            : 'hover:bg-green-50'
                        }`}
                      >
                        <Link to={createPageUrl(item.url)} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-green-100 p-4">
            {!isLoading && user ? (
              <div className="space-y-3">
                <Link to={createPageUrl("Profile")}>
                  <Button variant="outline" className="w-full justify-start gap-3 rounded-xl hover:bg-green-50">
                    <User className="w-4 h-4" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{user.full_name || (isFarmer ? 'Farmer' : 'Buyer')}</p>
                        <Badge variant="secondary" className="text-xs">
                          {isFarmer ? 'Farmer' : 'Buyer'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 rounded-xl hover:bg-red-50 hover:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
              >
                Login / Sign Up
              </Button>
            )}
            
            <div className="mt-4 pt-4 border-t border-green-100">
              <p className="text-xs text-center text-gray-500">
                by <span className="font-semibold text-green-600">CODEXA</span>
              </p>
              <p className="text-xs text-center text-gray-400">
                SwizFusion Technologies
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-green-50 p-2 rounded-lg" />
                <h1 className="text-lg font-bold brand-gradient">AgriFusion</h1>
              </div>
              {user && (
                <Badge variant="secondary">
                  {isFarmer ? 'Farmer' : 'Buyer'}
                </Badge>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}