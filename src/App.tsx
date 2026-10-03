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

import { Sidebar } from "./components/Sidebar";

import { Dashboard } from "./pages/Dashboard";
import { Agenda } from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import { Servicos } from "./pages/Servicos";
import { Clientes } from "./pages/Clientes";
import Perfil from "./pages/Perfil";

import { Inicio } from "./pages/Inicio";
import { Login } from "./pages/Login";
import { ResetarSenha } from "./pages/ResetarSenha";

import { Tutorial } from "./components/Tutorial";

import "./App.css";
import "./pages/Auth.css";

type Tela =
  | "inicio"
  | "login"
  | "cadastro"
  | "resetar-senha"
  | "app";

export default function App() {
  const [tela, setTela] = useState<Tela>("inicio");

  const [page, setPage] = useState<Page>(() => {
    const paginaSalva =
      localStorage.getItem(
        "lumora-pagina"
      ) as Page | null;

    return paginaSalva || "inicio";
  });

  const [paginaAnterior, setPaginaAnterior] =
    useState<Page>(() => {
      const paginaSalva =
        localStorage.getItem(
          "lumora-pagina-anterior"
        ) as Page | null;

      return paginaSalva || "inicio";
    });

  const [
    carregandoSessao,
    setCarregandoSessao,
  ] = useState(true);

  const [usuarioId, setUsuarioId] = useState("");

  const [nome, setNome] = useState("");

  const [
    tutorialAberto,
    setTutorialAberto,
  ] = useState(false);

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
    const destino =
      paginaAnterior === "perfil"
        ? "inicio"
        : paginaAnterior;

    setPage(destino);
  }

  /* =====================================================
     INICIAIS DO PROFISSIONAL
     ===================================================== */

  function obterIniciais(nomeCompleto: string) {
    const partes = nomeCompleto
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return (
      partes
        .map((parte) =>
          parte.charAt(0).toUpperCase()
        )
        .join("") || "LU"
    );
  }

  /* =====================================================
     CARREGAR TEMA E PROFISSIONAL
     ===================================================== */

  async function carregarTema(userId: string) {
    setUsuarioId(userId);

    const { data, error } = await supabase
      .from("configuracoes_negocio")
      .select(
        "cor_principal, nome_profissional"
      )
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
    }

    aplicarCor(
      data?.cor_principal ??
        COR_PADRAO
    );

    let nomeCompleto =
      (
        data?.nome_profissional ??
        ""
      ).trim();

    if (!nomeCompleto) {
      const { data: perfil } =
        await supabase
          .from("profiles")
          .select("nome")
          .eq("id", userId)
          .maybeSingle();

      nomeCompleto =
        (perfil?.nome ?? "").trim();
    }

    setNome(
      nomeCompleto
        .split(/\s+/)
        .filter(Boolean)[0] ?? ""
    );

    if (
      !localStorage.getItem(
        `lumora-tutorial-${userId}`
      )
    ) {
      setTutorialAberto(true);
    }
  }

  /* =====================================================
     FECHAR TUTORIAL
     ===================================================== */

  function fecharTutorial() {
    if (usuarioId) {
      localStorage.setItem(
        `lumora-tutorial-${usuarioId}`,
        "1"
      );
    }

    setTutorialAberto(false);
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
            setTela("resetar-senha");
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

            setTimeout(() => {
              carregarTema(
                session.user.id
              );
            }, 0);
          } else {
            setTela("inicio");
            setPage("inicio");
            setPaginaAnterior("inicio");
            setUsuarioId("");
            setNome("");
            setTutorialAberto(false);

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
     LOGIN / CADASTRO
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
            onVoltar={() => {
              setTela("inicio");
            }}
            onLogin={() => {
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
     RESETAR SENHA
     ===================================================== */

  if (tela === "resetar-senha") {
    return (
      <div className="app">
        <div className="mobile-shell">
          <ResetarSenha
            onVoltar={() => {
              setTela("login");
            }}
          />
        </div>
      </div>
    );
  }

  /* =====================================================
     ÁREA INTERNA DO LUMORA
     ===================================================== */

  const iniciais = obterIniciais(nome);

  return (
    <div className="app">

      {/* =========================================
          NAVEGAÇÃO DESKTOP
          ========================================= */}

      <Sidebar
        page={page}
        onChange={navegar}
        nome={nome || "Lumora"}
        iniciais={iniciais}
      />

      {/* =========================================
          CONTEÚDO
          ========================================= */}

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
            onAbrirTutorial={() =>
              setTutorialAberto(true)
            }
          />
        )}

        {/* =========================================
            MENU INFERIOR — CELULAR
            ========================================= */}

        {page !== "perfil" && (
          <BottomNav
            page={page}
            onChange={navegar}
          />
        )}

        {/* =========================================
            TUTORIAL
            ========================================= */}

        {tutorialAberto && (
          <Tutorial
            nome={nome}
            onIr={(pagina) => {
              navegar(pagina);
              fecharTutorial();
            }}
            onFechar={fecharTutorial}
          />
        )}

      </div>
    </div>
  );
}