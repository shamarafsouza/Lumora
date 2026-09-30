import { useEffect, useState } from "react";

import { supabase } from "./lib/supabase";
import {
  aplicarCor,
  COR_PADRAO,
} from "./lib/tema";

import {
  BottomNav,
  type Page,
} from "./components/BottomNav";

import { Dashboard } from "./pages/Dashboard";
import { Agenda } from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import { Servicos } from "./pages/Servicos";
import { Clientes } from "./pages/Clientes";
import Perfil from "./pages/Perfil";

import { Inicio } from "./pages/Inicio";
import { Login } from "./pages/Login";

import "./App.css";
import "./pages/Auth.css";

type Tela =
  | "inicio"
  | "login"
  | "cadastro"
  | "app";

export default function App() {
  const [tela, setTela] =
    useState<Tela>("inicio");

  const [page, setPage] =
    useState<Page>(() => {
      const paginaSalva =
        localStorage.getItem(
          "lumora-pagina"
        ) as Page | null;

      return paginaSalva || "inicio";
    });

  const [
    modoNovaSenha,
    setModoNovaSenha,
  ] = useState(false);

  const [
    carregandoSessao,
    setCarregandoSessao,
  ] = useState(true);

  /* =====================================================
     SALVAR PÁGINA
     ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "lumora-pagina",
      page
    );
  }, [page]);

  /* =====================================================
     CARREGAR TEMA
     ===================================================== */

  async function carregarTema(
    userId: string
  ) {
    const { data, error } =
      await supabase
        .from("configuracoes_negocio")
        .select("cor_principal")
        .eq(
          "profissional_id",
          userId
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Erro ao carregar tema:",
        error
      );

      aplicarCor(COR_PADRAO);
      return;
    }

    aplicarCor(
      data?.cor_principal ??
        COR_PADRAO
    );
  }

  /* =====================================================
     SESSÃO / AUTH
     ===================================================== */

  useEffect(() => {
    let montado = true;

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!montado) {
        return;
      }

      if (session) {
        setTela("app");

        const paginaSalva =
          localStorage.getItem(
            "lumora-pagina"
          ) as Page | null;

        setPage(
          paginaSalva || "inicio"
        );

        await carregarTema(
          session.user.id
        );
      } else {
        aplicarCor(COR_PADRAO);
      }

      if (montado) {
        setCarregandoSessao(false);
      }
    }

    verificarSessao();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          /* =========================================
             RECUPERAÇÃO DE SENHA
             ========================================= */

          if (
            event ===
            "PASSWORD_RECOVERY"
          ) {
            setModoNovaSenha(true);
            setTela("login");

            setCarregandoSessao(false);

            return;
          }

          /* =========================================
             LOGIN NORMAL
             ========================================= */

          if (session) {
            setTela("app");

            const paginaSalva =
              localStorage.getItem(
                "lumora-pagina"
              ) as Page | null;

            setPage(
              paginaSalva || "inicio"
            );

            setModoNovaSenha(false);

            setTimeout(() => {
              carregarTema(
                session.user.id
              );
            }, 0);
          } else {
            setTela("inicio");
            setPage("inicio");
            setModoNovaSenha(false);

            aplicarCor(COR_PADRAO);
          }
        }
      );

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     CARREGANDO
     ===================================================== */

  if (carregandoSessao) {
    return (
      <div className="app-loading">
        <div className="brand-mark">
          L
        </div>

        <strong>LUMORA</strong>

        <span>
          Carregando...
        </span>
      </div>
    );
  }

  /* =====================================================
     LANDING
     ===================================================== */

  if (tela === "inicio") {
    return (
      <div className="app">
        <div className="mobile-shell">
          <Inicio
            onEntrar={() =>
              setTela("login")
            }
            onCriarConta={() =>
              setTela("cadastro")
            }
          />
        </div>
      </div>
    );
  }

  /* =====================================================
     LOGIN / CADASTRO / RECUPERAÇÃO
     ===================================================== */

  if (
    tela === "login" ||
    tela === "cadastro"
  ) {
    return (
      <div className="app">
        <div className="mobile-shell">
          <Login
            modoCadastro={
              tela === "cadastro"
            }
            modoNovaSenha={
              modoNovaSenha
            }
            onVoltar={() => {
              setModoNovaSenha(false);
              setTela("inicio");
            }}
            onLogin={() => {
              setModoNovaSenha(false);
              setTela("app");

              const paginaSalva =
                localStorage.getItem(
                  "lumora-pagina"
                ) as Page | null;

              setPage(
                paginaSalva || "inicio"
              );
            }}
          />
        </div>
      </div>
    );
  }

  /* =====================================================
     NAVEGAÇÃO INTERNA
     ===================================================== */

  function navegar(
    novaPagina:
      | "agenda"
      | "financeiro"
      | "servicos"
      | "clientes"
      | "perfil"
  ) {
    setPage(novaPagina);
  }

  return (
    <div className="app">
      <div className="mobile-shell">

        {page === "inicio" && (
          <Dashboard
            onNavigate={navegar}
          />
        )}

        {page === "agenda" && (
          <Agenda
            onNavigate={navegar}
          />
        )}

        {page === "financeiro" && (
          <Financeiro
            onNavigate={navegar}
          />
        )}

        {page === "servicos" && (
          <Servicos
            onNavigate={navegar}
          />
        )}

        {page === "clientes" && (
          <Clientes
            onNavigate={navegar}
          />
        )}

        {page === "perfil" && (
          <Perfil
            onVoltar={() =>
              setPage("inicio")
            }
          />
        )}

        {page !== "perfil" && (
          <BottomNav
            page={page}
            onChange={setPage}
          />
        )}

      </div>
    </div>
  );
}
