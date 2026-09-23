import { useEffect, useState } from "react";

import { supabase } from "./lib/supabase";

import {
  BottomNav,
  type Page,
} from "./components/BottomNav";

import { Agenda } from "./pages/Agenda";
import { Financeiro } from "./pages/Financeiro";
import { Servicos } from "./pages/Servicos";
import { Clientes } from "./pages/Clientes";

import { Inicio } from "./pages/Inicio";
import { Login } from "./pages/Login";

import "./App.css";
import "./pages/Auth.css";

type Tela = "inicio" | "login" | "cadastro" | "app";

export default function App() {
  const [tela, setTela] = useState<Tela>("inicio");
  const [page, setPage] = useState<Page>("agenda");
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    let montado = true;

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!montado) return;

      if (session) {
        setTela("app");
      }

      setCarregandoSessao(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setTela("app");
        } else {
          setTela("inicio");
        }
      }
    );

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  if (carregandoSessao) {
    return (
      <div className="app-loading">
        <div className="brand-mark">L</div>
        <strong>LUMORA</strong>
        <span>Carregando...</span>
      </div>
    );
  }

  if (tela === "inicio") {
    return (
      <div className="app">
        <div className="mobile-shell">
          <Inicio
            onEntrar={() => setTela("login")}
            onCriarConta={() => setTela("cadastro")}
          />
        </div>
      </div>
    );
  }

  if (tela === "login" || tela === "cadastro") {
    return (
      <div className="app">
        <div className="mobile-shell">
          <Login
            modoCadastro={tela === "cadastro"}
            onVoltar={() => setTela("inicio")}
            onLogin={() => setTela("app")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="mobile-shell">
        {page === "agenda" && <Agenda />}

        {page === "financeiro" && <Financeiro />}

        {page === "servicos" && <Servicos />}

        {page === "clientes" && <Clientes />}

        <BottomNav
          page={page}
          onChange={setPage}
        />
      </div>
    </div>
  );
}