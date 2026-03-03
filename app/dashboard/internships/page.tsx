"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { internshipCategories, mockTrendingNews } from "@/lib/mock-data";
import { internshipsApi } from "@/lib/api";
import type { Internship } from "@/types";
import {
  Search,
  MapPin,
  Clock,
  Calendar,
  Users,
  Briefcase,
  Filter,
  X,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

export default function InternshipsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams?.get("category") || "all"
  );
  const [selectedLocation, setSelectedLocation] = useState<string>(
    searchParams?.get("location") || "all"
  );
  const [showRemoteOnly, setShowRemoteOnly] = useState(
    searchParams?.get("remote") === "true"
  );
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await internshipsApi.getAll();
      if (result.error) {
        throw new Error(result.error);
      }
      const ints = Array.isArray(result.data?.data)
        ? result.data.data
        : Array.isArray(result.data?.internships)
          ? result.data.internships
          : Array.isArray(result.data)
            ? result.data
            : [];
      setInternships(ints);
    } catch (err) {
      console.error("Error fetching internships:", err);
      setError(err instanceof Error ? err.message : "Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations
  const locations = useMemo(() => {
    const locs = [...new Set(internships.map((i) => i.location).filter(Boolean))];
    return locs.sort();
  }, [internships]);



  // Filter internships
  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const matchesSearch =
        searchQuery === "" ||
        internship.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || internship.category === selectedCategory;

      const matchesLocation =
        selectedLocation === "all" || internship.location === selectedLocation;

      const matchesRemote = !showRemoteOnly || internship.isRemote;

      return matchesSearch && matchesCategory && matchesLocation && matchesRemote;
    });
  }, [internships, searchQuery, selectedCategory, selectedLocation, showRemoteOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all";

  if (loading) {
    return (
      <Suspense fallback={<Loading />}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Suspense>
    );
  }

  if (error) {
    return (
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchInternships}>Try Again</Button>
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Internship Opportunities
          </h1>
          <p className="text-muted-foreground">
            Browse and apply for internships from our partner organizations
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter Companies</CardTitle>
            <CardDescription>
              Find companies by name, region, or industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search companies by name or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filter by:</span>
                  </div>



                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {internshipCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      <Briefcase className="h-3 w-3" />
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />
                      "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily News of Trending Companies in Ghana */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Daily News: Trending Companies in Ghana
                </CardTitle>
                <CardDescription>
                  Stay updated with the latest news from top maritime and logistics companies in Ghana
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 selection:bg-primary/10">
              {mockTrendingNews.map((news) => (
                <div
                  key={news.id}
                  className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-medium text-primary">
                      {news.company}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(news.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>{news.readTime}</span>
                    </div>
                  </div>

                  <h3 className="mb-2 font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {news.headline}
                  </h3>

                  <p className="mb-4 text-sm text-muted-foreground flex-grow">
                    {news.summary}
                  </p>

                  <Button variant="ghost" size="sm" className="mt-auto w-full justify-between" asChild>
                    <a href={news.url || "#"} target="_blank" rel="noopener noreferrer">
                      Read full article
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
            {mockTrendingNews.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Newspaper className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  No trending news available at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
