import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Home,
  Sparkles,
  Users,
} from "lucide-react";

import type { ReactNode } from "react";

export type Page =
  | "inicio"
  | "agenda"
  | "financeiro"
  | "servicos"
  | "clientes";

const items: [Page, string, ReactNode][] = [
  ["inicio", "Início", <Home />],
  ["agenda", "Agenda", <CalendarDays />],
  [
    "financeiro",
    "Financeiro",
    <ChartNoAxesColumnIncreasing />,
  ],
  ["servicos", "Serviços", <Sparkles />],
  ["clientes", "Clientes", <Users />],
];

export function BottomNav({
  page,
  onChange,
}: {
  page: Page;
  onChange: (page: Page) => void;
}) {
  return (
    <nav className="bottom-nav">
      {items.map(([id, label, icon]) => (
        <button
          className={page === id ? "active" : ""}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}