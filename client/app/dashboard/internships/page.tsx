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
  Building2,
  Send,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { lettersApi } from "@/lib/api";
import type { LetterRequestFormData, RegionalCompany } from "@/types";

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
  const [selectedCompanyRegion, setSelectedCompanyRegion] = useState<string>("all");

  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
  const [selectedLetterCompany, setSelectedLetterCompany] = useState<RegionalCompany | null>(null);
  const [isSubmittingLetter, setIsSubmittingLetter] = useState(false);
  const [letterFormData, setLetterFormData] = useState<LetterRequestFormData>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    internshipDuration: "",
    internshipStartDate: "",
    internshipEndDate: "",
    purpose: "",
    category: "",
    additionalNotes: "",
  });

  const handleLetterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setLetterFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLetterSelectChange = (name: string, value: string) => {
    setLetterFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLetter(true);

    try {
      const payload = {
        ...letterFormData,
        requestType: 'company',
      };
      const result = await lettersApi.createRequest(payload as any);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Letter request submitted successfully!");
        setLetterFormData({
          companyName: "",
          companyEmail: "",
          companyPhone: "",
          companyAddress: "",
          internshipDuration: "",
          internshipStartDate: "",
          internshipEndDate: "",
          purpose: "",
          category: "",
          additionalNotes: "",
        });
        setIsLetterDialogOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmittingLetter(false);
    }
  };

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

  const regions = useMemo(() => {
    const reg = [...new Set(mockRegionalCompanies.map(c => c.region))];
    return reg.sort();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (selectedCompanyRegion === "all") return mockRegionalCompanies;
    return mockRegionalCompanies.filter(c => c.region === selectedCompanyRegion);
  }, [selectedCompanyRegion]);

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

        {/* Companies by Region */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Partner Companies by Region
                </CardTitle>
                <CardDescription>
                  Explore maritime, engineering, and logistics companies across Ghana
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCompanyRegion} onValueChange={setSelectedCompanyRegion}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="font-medium bg-secondary/30">
                      {company.region} Region
                    </Badge>
                  </div>

                  <h3 className="mb-2 font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {company.name}
                  </h3>

                  <div className="mb-4 space-y-2 text-sm text-muted-foreground flex-grow">
                    <p className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {company.industry}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${company.email}`} className="text-primary hover:underline truncate" title={company.email}>
                        {company.email}
                      </a>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-auto"
                    onClick={() => {
                      setSelectedLetterCompany(company);
                      setLetterFormData({
                        companyName: company.name,
                        companyEmail: company.email || "",
                        companyPhone: "",
                        companyAddress: "",
                        internshipDuration: "",
                        internshipStartDate: "",
                        internshipEndDate: "",
                        purpose: "",
                        category: "",
                        additionalNotes: "",
                      });
                      setIsLetterDialogOpen(true);
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Letter
                  </Button>
                </div>
              ))}
            </div>
            {filteredCompanies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  No companies found for the selected region.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Letter Dialog */}
      <Dialog open={isLetterDialogOpen} onOpenChange={setIsLetterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Internship Letter</DialogTitle>
            <DialogDescription>
              Submit an official internship letter request for {selectedLetterCompany?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendLetter} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={letterFormData.companyName}
                  onChange={handleLetterChange}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    value={letterFormData.companyEmail}
                    onChange={handleLetterChange}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    value={letterFormData.companyPhone}
                    onChange={handleLetterChange}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  name="companyAddress"
                  value={letterFormData.companyAddress}
                  onChange={handleLetterChange}
                  placeholder="Physical address..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Internship Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="internshipDuration">
                  Internship Duration <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="internshipDuration"
                  name="internshipDuration"
                  value={letterFormData.internshipDuration}
                  onChange={handleLetterChange}
                  placeholder="e.g., 3 months"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="internshipStartDate">Start Date</Label>
                  <Input
                    id="internshipStartDate"
                    name="internshipStartDate"
                    type="date"
                    value={letterFormData.internshipStartDate}
                    onChange={handleLetterChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internshipEndDate">End Date</Label>
                  <Input
                    id="internshipEndDate"
                    name="internshipEndDate"
                    type="date"
                    value={letterFormData.internshipEndDate}
                    onChange={handleLetterChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Purpose & Category
              </h3>

              <div className="space-y-2">
                <Label htmlFor="purpose">
                  Purpose <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  value={letterFormData.purpose}
                  onChange={handleLetterChange}
                  placeholder="Describe the purpose of the internship..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Internship Category</Label>
                <Select
                  value={letterFormData.category || ""}
                  onValueChange={(value) => handleLetterSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marine-engineering">Marine Engineering</SelectItem>
                    <SelectItem value="nautical-science">Nautical Science</SelectItem>
                    <SelectItem value="port-shipping">Port & Shipping Administration</SelectItem>
                    <SelectItem value="maritime-safety">Maritime Safety & Security</SelectItem>
                    <SelectItem value="electrical-engineering">Electrical/Electronic Engineering</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={letterFormData.additionalNotes}
                  onChange={handleLetterChange}
                  placeholder="Any additional information..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLetterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingLetter}>
                {isSubmittingLetter ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Suspense>
  );
}
