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
  | "clientes"
  | "perfil";

const items: [Page, string, ReactNode][] = [
  [
    "inicio",
    "Início",
    <Home size={20} />,
  ],

  [
    "agenda",
    "Agenda",
    <CalendarDays size={20} />,
  ],

  [
    "financeiro",
    "Financeiro",
    <ChartNoAxesColumnIncreasing size={20} />,
  ],

  [
    "servicos",
    "Serviços",
    <Sparkles size={20} />,
  ],

  [
    "clientes",
    "Clientes",
    <Users size={20} />,
  ],
];

export function BottomNav({
  page,
  onChange,
}: {
  page: Page;
  onChange: (page: Page) => void;
}) {
  return (
    <nav
      className="bottom-nav"
      aria-label="Navegação principal"
    >
      {items.map(([id, label, icon]) => {
        const ativo = page === id;

        return (
          <button
            key={id}
            type="button"
            className={ativo ? "active" : ""}
            onClick={() => onChange(id)}
            aria-current={ativo ? "page" : undefined}
            aria-label={label}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}