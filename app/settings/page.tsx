//settings.tsx :
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Settings2,
  Bell,
  Globe,
  Wallet,
  Shield,
  PiggyBank,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  ChevronLeft,
  Home,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import Link from "next/link";
import Logo from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import LanguageCurrencySelector from "@/components/language-currency-selector";
import { updateUser } from "@/lib/firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@radix-ui/react-dropdown-menu";

const generalFormSchema = z.object({
  monthlyBudget: z.coerce.number().min(0),
  pushNotifications: z.boolean(),
  emailNotifications: z.boolean(),
  budgetAlerts: z.boolean(),
  paymentReminders: z.boolean(),
});

const securityFormSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SettingsPage() {
  const { language, translations, setLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const t = translations[language].settings;

  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      monthlyBudget: 0,
      pushNotifications: true,
      emailNotifications: true,
      budgetAlerts: true,
      paymentReminders: true,
    },
  });

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Load user settings from Firebase
      const fetchUserSettings = async () => {
        try {
          // In a real app, you would fetch user settings from Firestore
          // For now, we'll use some dummy values
          generalForm.setValue("monthlyBudget", 5000000); // Default for VND
          generalForm.setValue("pushNotifications", true);
          generalForm.setValue("emailNotifications", true);
          generalForm.setValue("budgetAlerts", true);
          generalForm.setValue("paymentReminders", true);
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      };

      fetchUserSettings();
    }
  }, [user, generalForm]);

  const onSaveGeneralSettings = async (
    data: z.infer<typeof generalFormSchema>
  ) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Thêm thông tin cơ bản của người dùng
      await updateUser(user.uid, {
        monthlyBudget: data.monthlyBudget,
        email: user.email || "",
        displayName: user.displayName || "User",
      });

      toast({
        title: t.saveSuccess,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t.saveError,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async (data: z.infer<typeof securityFormSchema>) => {
    if (!user) return;

    try {
      setIsChangingPassword(true);

      // In a real app, you would call Firebase Auth to change the password
      // For now, we'll just show a success toast

      // Reset form
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: t.passwordChanged,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: t.passwordError,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // In a real app, you would delete the user's account from Firebase Auth and Firestore
    // For now, we'll just close the dialog and redirect to the login page
    setShowDeleteDialog(false);

    toast({
      title: "Account deleted",
      description: "Your account has been successfully deleted",
      duration: 3000,
    });

    // Sign out and redirect to login
    router.push("/auth/login");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden md:block">
              <h1 className="text-lg font-medium">{t.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">
                  {language === "en"
                    ? "Back to Dashboard"
                    : "Quay lại Dashboard"}
                </span>
                <span className="inline md:hidden">
                  <Home className="h-4 w-4" />
                </span>
              </Button>
            </Link>
            <LanguageCurrencySelector />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">{t.title}</h2>
          </div>

          <Tabs
            defaultValue="general"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-3 max-w-[600px]">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span>{t.general}</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                <span>{t.appearance}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {typeof t.security === "object" && t.security
                    ? t.security.title || "Security"
                    : t.security || "Security"}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="general">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.general}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Form {...generalForm}>
                        <form
                          onSubmit={generalForm.handleSubmit(
                            onSaveGeneralSettings
                          )}
                          className="space-y-8"
                        >
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium flex items-center gap-2">
                                <PiggyBank className="h-5 w-5" />
                                {t.budget}
                              </h3>
                              <Separator className="my-3" />

                              <FormField
                                control={generalForm.control}
                                name="monthlyBudget"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t.monthlyBudget}</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div>
                              <h3 className="text-lg font-medium flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                {typeof t.notifications === "object"
                                  ? "Notifications"
                                  : t.notifications}
                              </h3>
                              <Separator className="my-3" />

                              <div className="space-y-4">
                                <FormField
                                  control={generalForm.control}
                                  name="pushNotifications"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          {t.pushNotifications}
                                        </FormLabel>
                                        <FormDescription>
                                          {language === "en"
                                            ? "Receive push notifications in your browser"
                                            : "Nhận thông báo đẩy trong trình duyệt của bạn"}
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={generalForm.control}
                                  name="emailNotifications"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          {t.emailNotifications}
                                        </FormLabel>
                                        <FormDescription>
                                          {
                                            t.formDescriptions
                                              .emailNotifications
                                          }
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={generalForm.control}
                                  name="budgetAlerts"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          {t.budgetAlerts}
                                        </FormLabel>
                                        <FormDescription>
                                          {t.formDescriptions.budgetAlerts}
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={generalForm.control}
                                  name="paymentReminders"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                          {t.paymentReminders}
                                        </FormLabel>
                                        <FormDescription>
                                          {language === "en"
                                            ? "Reminders for recurring payments"
                                            : "Nhắc nhở cho các khoản thanh toán định kỳ"}
                                        </FormDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <Button type="submit" disabled={isSaving}>
                            {isSaving && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t.saveChanges}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="appearance">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.appearance}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="theme">{t.theme}</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <ModeToggle />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="language">{t.language}</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <LanguageCurrencySelector />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="security">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {typeof t.security === "object"
                          ? t.security.title || "Security"
                          : t.security || "Security"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Form {...securityForm}>
                        <form
                          onSubmit={securityForm.handleSubmit(onChangePassword)}
                          className="space-y-6"
                        >
                          <h3 className="text-lg font-medium">
                            {t.changePassword}
                          </h3>
                          <Separator className="my-3" />

                          <FormField
                            control={securityForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.currentPassword}</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={securityForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.newPassword}</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={securityForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t.confirmPassword}</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t.saveChanges}
                          </Button>
                        </form>
                      </Form>

                      <Separator className="my-6" />

                      <div>
                        <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {t.deleteAccount}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t.deleteAccountWarning}
                        </p>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="mt-4">
                              {t.deleteButton}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t.deleteAccount}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteAccountWarning}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t.cancelButton}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAccount}>
                                {t.deleteButton}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
