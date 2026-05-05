import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BadgeEuro,
  CircleHelp,
  FileText,
  Flag,
  Inbox,
  KeyRound,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Receipt,
  Shield,
  ShoppingBag,
  Star,
  Users,
  Wallet,
} from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/financial-ledger": Wallet,
  "/financial-profit-earned": BadgeEuro,
  "/analytics": BarChart3,
  "/users": Users,
  "/campaigns": Megaphone,
  "/orders": ShoppingBag,
  "/criminal-check": Shield,
  "/documents": FileText,
  "/invoices": Receipt,
  "/feedback": MessageSquare,
  "/reports": Flag,
  "/reviews": Star,
  "/chats": MessagesSquare,
  "/nannow-chats": MessageSquare,
  "/messages": Inbox,
  "/super-access": KeyRound,
};

export function NavIcon({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  const Icon = NAV_ICONS[path] ?? CircleHelp;
  return (
    <Icon className={className} size={18} strokeWidth={1.75} aria-hidden />
  );
}
