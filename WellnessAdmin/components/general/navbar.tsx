"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import axios from "axios";
import Logo from "../../public/photo.png";
import Image from "next/image";

interface NavbarProps {
  pages: { label: string; href: string }[];
}

export function GenericNavbar(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const pages: NavbarProps["pages"] = [
    { label: "לוח בקרה", href: "/main" },
    { label: "ניהול משתמשים", href: "/main/users" },
    { label: "ניהול קטגוריות", href: "/main/categories" },
    { label: "ניהול מצבי רוח", href: "/main/moods" },
    { label: "ניהול התראות", href: "/main/notifications" },
  ];

  const handleLogout = async () => {
    try {
      await axios.get("/api/logout");
      router.refresh();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <nav
      className="flex items-center justify-between container mx-auto px-4 py-12 rtl bg-background"
      dir="rtl"
    >
      <div className="flex items-center space-x-4 space-x-reverse">
        <Link href="/main">
          <Image
            className="select-none cursor-pointer"
            src={Logo}
            alt="לוגו"
            width={80}
            height={80}
          />
        </Link>
      </div>

      <div className="hidden md:flex space-x-4 space-x-reverse">
        {pages.map((page) => (
          <Link key={page.href} href={page.href} passHref>
            <Button variant="ghost">{page.label}</Button>
          </Link>
        ))}
        <Button variant="default" onClick={handleLogout}>
          התנתק
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>תפריט</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4">
            {pages.map((page) => (
              <Link key={page.href} href={page.href} passHref>
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full justify-start"
                >
                  {page.label}
                </Button>
              </Link>
            ))}
            <Button variant="default" onClick={handleLogout}>
              התנתק
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
