import { Briefcase, CalendarRange, Ellipsis, Target, Wallet, Zap, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Zap },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/more", label: "More", icon: Ellipsis },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
