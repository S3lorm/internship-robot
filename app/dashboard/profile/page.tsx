"use client";

import React from "react"

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { departments, programs } from "@/lib/mock-data";
import { authApi } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    department: user?.department || "",
    program: user?.program || "",
    yearOfStudy: user?.yearOfStudy || 1,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "yearOfStudy" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateUser(formData);
    setIsLoading(false);
    toast.success("Profile updated successfully!");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
              <div className="relative">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    {isUploadingAvatar ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage 
                          src={
                            avatarPreview 
                              ? avatarPreview 
                              : user.avatar 
                                ? user.avatar.startsWith('http') || user.avatar.startsWith('/uploads')
                                  ? user.avatar.startsWith('http')
                                    ? user.avatar
                                    : `${typeof window !== 'undefined' ? window.location.origin : ''}${user.avatar}`
                                  : user.avatar
                                : "/placeholder.svg"
                          } 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
                          {user.firstName?.[0] || ""}
                          {user.lastName?.[0] || ""}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <label
                    className={`absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:bg-primary/90 cursor-pointer ${
                      isUploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Change profile picture"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image size must be less than 5MB");
                          return;
                        }
                        
                        // Validate file type
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
                        if (!allowedTypes.includes(file.type)) {
                          toast.error("Please select a JPG, PNG, or WEBP image file");
                          return;
                        }
                        
                        // Show preview immediately
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatarPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        
                        setIsUploadingAvatar(true);
                        try {
                          const result = await authApi.uploadAvatar(file);
                          
                          if (result.error) {
                            toast.error(result.error);
                            setAvatarPreview(null); // Clear preview on error
                          } else {
                            toast.success("Profile photo updated successfully!");
                            // Update user with new avatar URL
                            if (result.data?.user) {
                              updateUser(result.data.user);
                            } else if (result.data?.avatarUrl) {
                              updateUser({ ...user, avatar: result.data.avatarUrl });
                            } else if (result.data?.avatar) {
                              updateUser({ ...user, avatar: result.data.avatar });
                            }
                            // Clear preview after successful upload - the actual image will load
                            setTimeout(() => setAvatarPreview(null), 500);
                          }
                        } catch (error: any) {
                          toast.error(error.message || "Failed to upload photo");
                          setAvatarPreview(null);
                        } finally {
                          setIsUploadingAvatar(false);
                        }
                      }}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                {user.avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to remove your profile photo?")) {
                        return;
                      }
                      try {
                        const result = await authApi.removeAvatar();
                        if (result.error) {
                          toast.error(result.error);
                        } else {
                          toast.success("Profile photo removed");
                          if (result.data?.user) {
                            updateUser(result.data.user);
                          } else {
                            updateUser({ ...user, avatar: null });
                          }
                          setAvatarPreview(null);
                        }
                      } catch (error: any) {
                        toast.error(error.message || "Failed to remove photo");
                      }
                    }}
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge variant="secondary" className="gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {user.program}
                  </Badge>
                  {user.isEmailVerified ? (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-200">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233 XX XXX XXXX"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Your academic details at Regional Maritime University
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="studentId"
                      value={user.studentId || ""}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Student ID cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select department" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Select
                    value={formData.program}
                    onValueChange={(value) => handleSelectChange("program", value)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select program" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((prog) => (
                        <SelectItem key={prog} value={prog}>
                          {prog}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Select
                    value={formData.yearOfStudy.toString()}
                    onValueChange={(value) => handleSelectChange("yearOfStudy", value)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select year" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
