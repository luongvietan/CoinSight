"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Upload,
  Trash2,
  Loader2,
  BarChart3,
  Calendar,
  Target,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { updateUser, getUserTransactions } from "@/lib/firebase/firestore";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/types/transaction";
import { format } from "date-fns";

const formSchema = z.object({
  displayName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email().optional(),
});

export default function ProfilePage() {
  const { language, translations } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[language].profile;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      form.setValue("displayName", user.displayName || "");
      form.setValue("email", user.email || "");

      // Fetch user transactions for statistics
      const fetchTransactions = async () => {
        try {
          setIsLoading(true);
          const userTransactions = await getUserTransactions(user.uid);
          setTransactions(userTransactions);
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [user, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Thêm thông tin email từ user auth
      await updateUser(user.uid, {
        displayName: data.displayName,
        email: user.email || "",
      });

      toast({
        title: t.updateSuccess,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t.updateError,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push("/")}
            >
              <ChevronLeft className="h-4 w-4" />
              {language === "en" ? "Back to Home" : "Quay về trang chủ"}
            </Button>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-4">{t.title}</h1>
        <Separator className="my-4" />
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t.personalInfo}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="flex flex-col items-center space-y-3">
                        <Avatar className="h-24 w-24">
                          {photoPreview ? (
                            <AvatarImage
                              src={photoPreview}
                              alt={user?.displayName || ""}
                            />
                          ) : (
                            <AvatarImage
                              src={
                                user?.photoURL ||
                                "/placeholder.svg?height=96&width=96"
                              }
                              alt={user?.displayName || ""}
                            />
                          )}
                          <AvatarFallback className="text-2xl">
                            {user?.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex gap-1 text-xs"
                            onClick={() =>
                              document.getElementById("photo-upload")?.click()
                            }
                          >
                            <Upload className="h-3 w-3" />
                            <span>{t.changePhoto}</span>
                          </Button>

                          {(user?.photoURL || photoPreview) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex gap-1 text-xs"
                              onClick={handleRemovePhoto}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />

                        <p className="text-xs text-muted-foreground">
                          {t.uploadHint}
                        </p>
                      </div>

                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.name}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.email}</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="ml-auto"
                    >
                      {isUpdating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t.updateProfile}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t.statistics}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium">
                      {t.transactionsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        transactions.length
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium">
                      {t.budgetsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        0 // Replace with actual budget count
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium">{t.goalsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        0 // Replace with actual goals count
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium">{t.joinedOn}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {user?.metadata?.creationTime
                        ? format(new Date(user.metadata.creationTime), "PPP")
                        : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
