"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { authApi } from "@/lib/api";
import { SettingsNotificationPreferences } from "@/components/settings-notification-preferences";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    applicationUpdates: true,
    newInternships: true,
    deadlineReminders: true,
    letterRequestUpdates: true,
    evaluationUpdates: true,
  });
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    timezone: "GMT",
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
  });
  
  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoadingPrefs(true);
      try {
        const result = await authApi.getPreferences();
        if (result.data?.preferences) {
          const prefs = result.data.preferences;
          setNotifications({
            emailNotifications: prefs.emailNotifications ?? true,
            pushNotifications: prefs.pushNotifications ?? false,
            applicationUpdates: prefs.applicationUpdates ?? true,
            newInternships: prefs.newInternships ?? true,
            deadlineReminders: prefs.deadlineReminders ?? true,
            letterRequestUpdates: prefs.letterRequestUpdates ?? true,
            evaluationUpdates: prefs.evaluationUpdates ?? true,
          });
          const theme =
            prefs.theme === "dark" || prefs.theme === "light" ? prefs.theme : "light";
          setPreferences({
            theme,
            language: prefs.language ?? "en",
            timezone: prefs.timezone ?? "GMT",
            profileVisibility: prefs.profileVisibility ?? "public",
            showEmail: prefs.showEmail ?? false,
            showPhone: prefs.showPhone ?? false,
          });
          setTheme(theme);
        }
      } catch (error: any) {
        console.error("Failed to load preferences:", error);
        toast.error("Failed to load preferences");
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [setTheme]);

  const applyTheme = (theme: "light" | "dark") => {
    setPreferences((prev) => ({ ...prev, theme }));
    setTheme(theme);
  };

  const activeTheme =
    preferences.theme === "dark" || preferences.theme === "light"
      ? preferences.theme
      : resolvedTheme === "dark"
        ? "dark"
        : "light";

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await authApi.updatePreferences({
        ...notifications,
        ...preferences,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Notification preferences saved");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      const result = await authApi.updatePreferences({
        ...notifications,
        ...preferences,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preferences saved");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await authApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password changed successfully");
        setShowPasswordDialog(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsNotificationPreferences
            notifications={notifications}
            onToggle={handleNotificationChange}
            isLoadingPrefs={isLoadingPrefs}
            isSaving={isLoading}
            onSave={handleSaveNotifications}
            role={user?.role ?? "student"}
          />
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Customize your experience on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Theme
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Applies immediately. Save preferences to remember on other devices.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={activeTheme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyTheme("light")}
                      disabled={isLoadingPrefs}
                      aria-pressed={activeTheme === "light"}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={activeTheme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyTheme("dark")}
                      disabled={isLoadingPrefs}
                      aria-pressed={activeTheme === "dark"}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </Label>
                  <Input
                    id="language"
                    value="English"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    More languages coming soon
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={preferences.timezone}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        timezone: e.target.value,
                      }))
                    }
                    disabled={isLoadingPrefs}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={isLoading}>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4" />
                      <p className="font-medium">Password</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Change your account password to keep your account secure
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Login Activity */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Login Activity</p>
                    <p className="text-sm text-muted-foreground">
                      View recent login attempts and sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select
                    value={preferences.profileVisibility}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, profileVisibility: value }))
                    }
                    disabled={isLoadingPrefs}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Everyone can see</SelectItem>
                      <SelectItem value="students_only">Students Only</SelectItem>
                      <SelectItem value="private">Private - Only me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-email">Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your email address
                    </p>
                  </div>
                  <Switch
                    id="show-email"
                    checked={preferences.showEmail}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, showEmail: checked }))
                    }
                    disabled={isLoadingPrefs}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-phone">Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your phone number
                    </p>
                  </div>
                  <Switch
                    id="show-phone"
                    checked={preferences.showPhone}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, showPhone: checked }))
                    }
                    disabled={isLoadingPrefs}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={isLoading}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password (min 6 characters)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
