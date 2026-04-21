import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleHelp,
  FileText,
  Flag,
  Inbox,
  KeyRound,
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
  "/analytics": BarChart3,
  "/users": Users,
  "/orders": ShoppingBag,
  "/criminal-check": Shield,
  "/documents": FileText,
  "/invoices": Receipt,
  "/feedback": MessageSquare,
  "/reports": Flag,
  "/reviews": Star,
  "/chats": MessagesSquare,
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
