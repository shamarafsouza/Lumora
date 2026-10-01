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
    carregandoSessao,
    setCarregandoSessao,
  ] = useState(true);

  const [usuarioId, setUsuarioId] =
    useState("");

  const [nome, setNome] =
    useState("");

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
