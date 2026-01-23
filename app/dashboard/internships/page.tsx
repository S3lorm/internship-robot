"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockInternships, internshipCategories } from "@/lib/mock-data";
import {
  Search,
  MapPin,
  Clock,
  Calendar,
  Users,
  Briefcase,
  Filter,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

export default function InternshipsPage() {
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

  // Get unique locations
  const locations = useMemo(() => {
    const locs = [...new Set(mockInternships.map((i) => i.location))];
    return locs.sort();
  }, []);

  // Filter internships
  const filteredInternships = useMemo(() => {
    return mockInternships.filter((internship) => {
      const matchesSearch =
        searchQuery === "" ||
        internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || internship.category === selectedCategory;

      const matchesLocation =
        selectedLocation === "all" || internship.location === selectedLocation;

      const matchesRemote = !showRemoteOnly || internship.isRemote;

      return matchesSearch && matchesCategory && matchesLocation && matchesRemote;
    });
  }, [searchQuery, selectedCategory, selectedLocation, showRemoteOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setShowRemoteOnly(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedLocation !== "all" ||
    showRemoteOnly;

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
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, company, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Filters:</span>
                </div>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {internshipCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showRemoteOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                >
                  Remote Only
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredInternships.length} of {mockInternships.length}{" "}
            internships
          </p>
        </div>

        {/* Internship List */}
        {filteredInternships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No internships found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInternships.map((internship) => {
              const deadline = new Date(internship.applicationDeadline);
              const isDeadlineSoon =
                deadline.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
              const slotsRemaining = Math.max(
                0,
                internship.slots - internship.applicationsCount
              );

              return (
                <Link
                  key={internship.id}
                  href={`/dashboard/internships/${internship.id}`}
                  className="group"
                >
                  <Card className="h-full transition-all hover:border-primary hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary">{internship.category}</Badge>
                        <div className="flex gap-1">
                          {internship.isRemote && (
                            <Badge variant="outline" className="text-xs">
                              Remote
                            </Badge>
                          )}
                          {isDeadlineSoon && (
                            <Badge variant="destructive" className="text-xs">
                              Closing Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-lg group-hover:text-primary">
                        {internship.title}
                      </CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">
                        {internship.company}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {internship.description}
                      </p>

                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {internship.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {internship.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline:{" "}
                          {deadline.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {slotsRemaining} slots left
                        </span>
                      </div>

                      {internship.stipend && (
                        <p className="text-sm font-medium text-primary">
                          {internship.stipend}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Suspense>
  );
}
