"use client";

import { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Settings,
  Plus,
  Bell,
  Target,
  Wrench,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import LanguageCurrencySelector from "./language-currency-selector";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface HeaderProps {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: HeaderProps) {
  const { language, translations } = useLanguage();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("User");
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const t = translations[language].header;

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t.greetings.morning);
    else if (hour < 18) setGreeting(t.greetings.afternoon);
    else setGreeting(t.greetings.evening);

    // Lấy tên người dùng từ auth
    if (user && user.displayName) {
      setUserName(user.displayName);
    } else {
      setUserName(t.defaultUserName);
    }
  }, [t, user]);

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn sau!",
        variant: "success",
      });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      toast({
        title: "Lỗi đăng xuất",
        description: "Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              {greeting}, {userName}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onAddClick}
              className="bg-primary hover:bg-primary/90 relative"
              aria-label={t.addTransaction}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline ml-2">{t.addTransaction}</span>
              <span className="sr-only md:hidden">{t.addTransaction}</span>
              <kbd className="hidden md:inline-flex ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">Ctrl</span>N
              </kbd>
            </Button>
          </motion.div>

          <div className="hidden md:block">
            <LanguageCurrencySelector />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative hidden md:flex"
                aria-label={t.notifications}
              >
                <Bell className="h-4 w-4" />
                <span className="sr-only">{t.notifications}</span>
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span>{t.notificationItems.newFeature}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>{t.notificationItems.budgetAlert}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center">
            <ModeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                aria-label={t.userMenu}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user?.photoURL || "/placeholder.svg?height=32&width=32"
                    }
                    alt={t.userAlt}
                  />
                  <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.profile}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/goals" className="flex items-center w-full">
                  <Target className="mr-2 h-4 w-4" />
                  <span>{translations[language].goals.title}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/tools" className="flex items-center w-full">
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.tools}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.settings}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.menuItems.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>{t.notifications}</span>
                <Badge className="ml-2">2</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="md:hidden px-2 py-1.5">
                <LanguageCurrencySelector />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.profile}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/goals" className="flex items-center w-full">
                  <Target className="mr-2 h-4 w-4" />
                  <span>{translations[language].goals.title}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/tools" className="flex items-center w-full">
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.tools}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.menuItems.settings}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.menuItems.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
