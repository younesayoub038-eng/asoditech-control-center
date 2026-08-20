"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Package,
  Server,
  CreditCard,
  Receipt,
  ScrollText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/produits", label: "Produits", icon: Package },
  { href: "/instances", label: "Instances", icon: Server },
  { href: "/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/paiements", label: "Paiements", icon: Receipt },
  { href: "/journal-audit", label: "Journal d'audit", icon: ScrollText },
  { href: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function SidebarNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "gap-0.5 p-2",
        orientation === "vertical" ? "flex flex-col" : "flex flex-row overflow-x-auto"
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
