import { HeaderLink } from "@/types/HeaderLink";

export const links: HeaderLink[] = [
  { title: "Orders", link: "/orders" },
  { title: "Schedule", link: "/schedule" },
  { title: "Users", link: "/users" },
  {
    title: "Compensation",
    link: "/compensation?mode=clients&hasRequestedCompensationInfoAt=true&page=1",
  },
  { title: "Campaigns", link: "/campaigns" },
  { title: "Credits", link: "/credits" },
  { title: "Criminal check", link: "/criminal-check" },
  { title: "Documents", link: "/documents" },
  { title: "Financial ledger", link: "/financial-ledger" },
  { title: "Earned profit", link: "/financial-profit-earned" },
  { title: "Analytics", link: "/analytics" },
  { title: "Map", link: "/map" },
  { title: "Invoices", link: "/invoices" },
  //{ title: "Kids", link: "/kids" },
  //{ title: "Payments", link: "/payments" },
  //{ title: "Bugs", link: "/bugs" },
  { title: "Feedback", link: "/feedback" },
  { title: "Reported", link: "/reports" },
  { title: "Reviews", link: "/reviews" },
  { title: "Chats", link: "/chats" },
  { title: "Nannow chats", link: "/nannow-chats" },
  { title: "Messages", link: "/messages" },
];
