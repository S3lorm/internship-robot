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
import { internshipCategories, mockRegionalCompanies } from "@/lib/mock-data";
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
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showAllCompanies, setShowAllCompanies] = useState(false);
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

  // Get unique regions from companies (static data)
  const regions = useMemo(() => {
    const unique = [...new Set(mockRegionalCompanies.map((c) => c.region))];
    return unique.sort();
  }, []);

  // Get unique industries from companies (static data)
  const industries = useMemo(() => {
    const unique = [...new Set(mockRegionalCompanies.map((c) => c.industry))];
    return unique.sort();
  }, []);

  // Filter companies by region, category, and search query (static data)
  const filteredCompanies = useMemo(() => {
    let filtered = mockRegionalCompanies;

    // Filter by region
    if (selectedRegion !== "all") {
      filtered = filtered.filter((c) => c.region === selectedRegion);
    }

    // Filter by industry/category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.industry === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.industry.toLowerCase().includes(query) ||
          c.region.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedRegion, selectedCategory, searchQuery]);

  // Limit companies display
  const displayedCompanies = useMemo(() => {
    return showAllCompanies ? filteredCompanies : filteredCompanies.slice(0, 6);
  }, [filteredCompanies, showAllCompanies]);

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
    setSelectedRegion("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedRegion !== "all";

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
                    value={selectedRegion}
                    onValueChange={setSelectedRegion}
                  >
                    <SelectTrigger className="w-[200px]">
                      <MapPin className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                  {selectedRegion !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedRegion}
                      <button
                        onClick={() => setSelectedRegion("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
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

        {/* Companies by Region - Apply via Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Companies by Region</CardTitle>
                <CardDescription>
                  {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} found
                  {selectedRegion !== "all" && ` in ${selectedRegion}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedCompanies.map((company) => {
                const subject = encodeURIComponent(`Internship Application - ${user?.firstName} ${user?.lastName}`);
                const body = encodeURIComponent(
                  `Dear Hiring Team,\n\nI am interested in applying for an internship position at ${company.name}.\n\nPlease find my details below:\nName: ${user?.firstName} ${user?.lastName}\nEmail: ${user?.email}\nStudent ID: ${user?.studentId || "N/A"}\nDepartment: ${user?.department || "N/A"}\n\nI look forward to hearing from you.\n\nBest regards`
                );
                const mailtoLink = `mailto:${company.email}?subject=${subject}&body=${body}`;
                return (
                  <div
                    key={company.id}
                    className="flex flex-col rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {company.industry}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {company.region}
                      </span>
                    </div>
                    <h3 className="mb-1 font-medium text-foreground">
                      {company.name}
                    </h3>
                    <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {company.email}
                    </p>
                    <Button asChild size="sm" className="mt-auto w-full">
                      <a href={mailtoLink} target="_blank" rel="noopener noreferrer">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Application via Email
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
            {filteredCompanies.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No companies found in this region.
              </p>
            )}
            {filteredCompanies.length > 6 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllCompanies(!showAllCompanies)}
                  className="gap-2"
                >
                  {showAllCompanies ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      View Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      View All ({filteredCompanies.length} companies)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
