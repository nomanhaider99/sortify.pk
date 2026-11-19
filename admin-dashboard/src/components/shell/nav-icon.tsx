import {
  FolderTree,
  LayoutGrid,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { NavIcon as NavIconName } from "@/lib/nav";

const ICONS = {
  dashboard: LayoutGrid,
  orders: ShoppingCart,
  products: Package,
  categories: FolderTree,
  reviews: Star,
  customers: UserRound,
  messages: MessageSquare,
  users: UsersRound,
  settings: Settings,
  audit: ScrollText,
} as const;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}
