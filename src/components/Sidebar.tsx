import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Home,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Page } from "./BottomNav";

type SidebarItem = {
  id: Page;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  page: Page;
  onChange: (page: Page) => void;
  nome?: string;
  iniciais?: string;
};

const items: SidebarItem[] = [
  {
    id: "inicio",
    label: "Início",
    icon: Home,
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    id: "servicos",
    label: "Serviços",
    icon: Sparkles,
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
  },
];

export function Sidebar({
  page,
  onChange,
  nome = "Lumora",
  iniciais = "LU",
}: SidebarProps) {
  return (
    <aside className="desktop-sidebar">
      <div className="desktop-sidebar-brand">
        <img
          src="/lumora.png"
          alt="Lumora"
          className="desktop-sidebar-logo"
        />
      </div>

      <nav
        className="desktop-sidebar-nav"
        aria-label="Navegação principal"
      >
        <span className="desktop-sidebar-label">
          Menu
        </span>

        {items.map(({ id, label, icon: Icon }) => {
          const ativo = page === id;

          return (
            <button
              key={id}
              type="button"
              className={`desktop-sidebar-item ${
                ativo ? "active" : ""
              }`}
              onClick={() => onChange(id)}
              aria-current={ativo ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="desktop-sidebar-bottom">
        <button
          type="button"
          className={`desktop-sidebar-item ${
            page === "perfil" ? "active" : ""
          }`}
          onClick={() => onChange("perfil")}
        >
          <Settings size={19} />
          <span>Perfil</span>
        </button>

        <div className="desktop-sidebar-user">
          <div className="desktop-sidebar-avatar">
            {iniciais}
          </div>

          <div className="desktop-sidebar-user-info">
            <strong>{nome}</strong>
            <span>Minha conta</span>
          </div>
        </div>
      </div>
    </aside>
  );
}