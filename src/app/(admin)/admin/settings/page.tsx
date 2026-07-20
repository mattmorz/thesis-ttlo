"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  LogOut,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSession, signOut } from "next-auth/react";
import {
  clearAppOwnedLocalStorage,
  clearAppOwnedSessionStorage,
} from "@/lib/utils/localStorage-utils";
import { useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/trpc/client";

// Profile schema — only name is editable; email is read-only (Google OAuth)
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";

  // TRPC mutation — updates userAccount.name in the database
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: async (data) => {
      // Refresh the NextAuth session so the new name appears in the UI immediately
      await updateSession({ name: data.name });
      toast({
        title: "Profile updated",
        description: "Your display name has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message || "Please try again.",
      });
    },
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  // Sync form value when session loads
  useEffect(() => {
    if (session?.user?.name) {
      profileForm.reset({ name: session.user.name });
    }
  }, [session?.user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const getUserInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const handleProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    updateProfile.mutate({ name: values.name });
  };

  const handleSignOut = async () => {
    clearAppOwnedLocalStorage();
    clearAppOwnedSessionStorage();
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (!session) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access your settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="shrink-0">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ── ACCOUNT TAB ── */}
        <TabsContent value="account">
          <div className="grid gap-6">
            {/* Current profile summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your current account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="text-lg">
                      {getUserInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-medium">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Role: {session.user.role || "User"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable profile form */}
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your display name</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        disabled
                        value={session.user.email || ""}
                        type="email"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email is managed by your Google account and cannot be
                        changed here.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input disabled value={session.user.role || "User"} />
                      <p className="text-xs text-muted-foreground">
                        Only administrators can change user roles.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium">
                    Notification preferences coming soon
                  </p>
                  <p className="mt-1 text-blue-700">
                    In-app and email notification settings will be configurable
                    here in a future update. You currently receive notifications
                    through the system's built-in notification panel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Your account security and authentication method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium">Secured with Google OAuth</p>
                  <p className="mt-1 text-green-700">
                    Your account uses Google Sign-In for authentication. There
                    is no separate password — your security is managed directly
                    by Google.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Connected account</p>
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>
                      {getUserInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded px-2 py-0.5">
                    Active
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To manage your Google account security (two-factor
                  authentication, recovery options, etc.), visit your Google
                  Account settings.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Google Account Security
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
