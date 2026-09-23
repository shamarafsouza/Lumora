import { useState } from "react";

import { BottomNav, type Page } from "./components/BottomNav";
import { Agenda } from "./pages/Agenda";
import { Financeiro } from "./pages/Financeiro";
import { Servicos } from "./pages/Servicos";
import { Clientes } from "./pages/Clientes";

import "./App.css";

export default function App() {
  const [page, setPage] = useState<Page>("agenda");

  return (
    <div className="app">
      <div className="mobile-shell">
        {page === "agenda" && <Agenda />}
        {page === "financeiro" && <Financeiro />}
        {page === "servicos" && <Servicos />}
        {page === "clientes" && <Clientes />}

        <BottomNav page={page} onChange={setPage} />
      </div>
    </div>
  );
}