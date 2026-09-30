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

  /*
   * Guarda a página em que a profissional estava
   * antes de abrir o Perfil.
   *
   * Assim:
   *
   * Serviços → Perfil → Voltar → Serviços
   * Agenda → Perfil → Voltar → Agenda
   * Financeiro → Perfil → Voltar → Financeiro
   * Clientes → Perfil → Voltar → Clientes
   */
  const [paginaAnterior, setPaginaAnterior] =
    useState<Page>(() => {
      const paginaSalva =
        localStorage.getItem(
          "lumora-pagina-anterior"
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
     SALVAR PÁGINA ATUAL
     ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "lumora-pagina",
      page
    );
  }, [page]);

  /* =====================================================
     SALVAR PÁGINA ANTERIOR
     ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "lumora-pagina-anterior",
      paginaAnterior
    );
  }, [paginaAnterior]);

  /* =====================================================
     NAVEGAÇÃO INTERNA
     ===================================================== */

  function navegar(novaPagina: Page) {
    /*
     * Quando abrir o Perfil, guarda a tela atual.
     *
     * Não sobrescreve a página anterior se já
     * estivermos no Perfil.
     */
    if (
      novaPagina === "perfil" &&
      page !== "perfil"
    ) {
      setPaginaAnterior(page);
    }

    setPage(novaPagina);
  }

  /* =====================================================
     VOLTAR DO PERFIL
     ===================================================== */

  function voltarDoPerfil() {
    /*
     * Se por algum motivo a página anterior também
     * for Perfil, usamos Início como segurança.
     */
    const destino =
      paginaAnterior === "perfil"
        ? "inicio"
        : paginaAnterior;

    setPage(destino);
  }

  /* =====================================================
     CARREGAR TEMA
     ===================================================== */

  async function carregarTema(
    userId: string
  ) {
    const {
      data,
      error,
    } = await supabase
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
      } =
        await supabase.auth.getSession();

      if (!montado) {
        return;
      }

      if (session) {
        setTela("app");

        const paginaSalva =
          localStorage.getItem(
            "lumora-pagina"
          ) as Page | null;

        /*
         * Se existir uma página salva, usamos ela.
         *
         * Caso não exista, o dashboard é a tela
         * inicial da área interna.
         */
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

            /*
             * Evita fazer uma operação assíncrona
             * diretamente dentro do callback do
             * Supabase.
             */
            setTimeout(() => {
              carregarTema(
                session.user.id
              );
            }, 0);
          } else {
            setTela("inicio");
            setPage("inicio");
            setPaginaAnterior("inicio");
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
     ÁREA INTERNA DO LUMORA
     ===================================================== */

  return (
    <div className="app">
      <div className="mobile-shell">

        {/* =========================================
            INÍCIO / DASHBOARD
            ========================================= */}

        {page === "inicio" && (
          <Dashboard
            onNavigate={navegar}
          />
        )}

        {/* =========================================
            AGENDA
            ========================================= */}

        {page === "agenda" && (
          <Agenda
            onNavigate={navegar}
          />
        )}

        {/* =========================================
            FINANCEIRO
            ========================================= */}

        {page === "financeiro" && (
          <Financeiro
            onNavigate={navegar}
          />
        )}

        {/* =========================================
            SERVIÇOS
            ========================================= */}

        {page === "servicos" && (
          <Servicos
            onNavigate={navegar}
          />
        )}

        {/* =========================================
            CLIENTES
            ========================================= */}

        {page === "clientes" && (
          <Clientes
            onNavigate={navegar}
          />
        )}

        {/* =========================================
            PERFIL
            ========================================= */}

        {page === "perfil" && (
          <Perfil
            onVoltar={
              voltarDoPerfil
            }
          />
        )}

        {/* =========================================
            MENU INFERIOR
            ========================================= */}

        {page !== "perfil" && (
          <BottomNav
            page={page}
            onChange={navegar}
          />
        )}

      </div>
    </div>
  );
}
