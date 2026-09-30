import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type LoginProps = {
  onVoltar: () => void;
  onLogin: () => void;
  modoCadastro?: boolean;
};

export function Login({
  onVoltar,
  onLogin,
  modoCadastro = false,
}: LoginProps) {
  const [cadastro, setCadastro] = useState(modoCadastro);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function entrar() {
    setErro("");
    setSucesso("");

    if (!email.trim() || !senha) {
      setErro("Preencha seu e-mail e sua senha.");
      return;
    }

    setCarregando(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message
      );

      setCarregando(false);
      return;
    }

    if (data.session) {
      onLogin();
    }

    setCarregando(false);
  }

  async function criarConta() {
    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("Digite seu nome.");
      return;
    }

    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (senha.length < 6) {
      setErro(
        "A senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    setCarregando(true);

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
            telefone: telefone.trim(),
          },
        },
      });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    if (data.user && data.session) {
      const { error: profileError } =
        await supabase.from("profiles").insert({
          id: data.user.id,
          nome: nome.trim(),
          telefone: telefone.trim() || null,
        });

      if (
        profileError &&
        profileError.code !== "23505"
      ) {
        setErro(
          "Sua conta foi criada, mas não conseguimos salvar seu perfil."
        );

        setCarregando(false);
        return;
      }

      setCarregando(false);
      onLogin();
      return;
    }

    setSucesso(
      "Conta criada! Verifique seu e-mail para confirmar o cadastro."
    );

    setCarregando(false);
  }

  async function enviarFormulario(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    if (cadastro) {
      await criarConta();
    } else {
      await entrar();
    }
  }

  function alternarModo() {
    setCadastro((atual) => !atual);
    setErro("");
    setSucesso("");
    setMostrarSenha(false);
  }

  return (
    <main className="auth-page">
      <button
        type="button"
        className="auth-back"
        onClick={onVoltar}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="auth-card">
        {/* LOGO OFICIAL DO LUMORA */}
        <div className="auth-brand">
          <img
            src="/lumora.png"
            alt="Lumora — Gestão para profissionais de beleza"
            className="auth-logo"
          />
        </div>

        {/* TÍTULO */}
        <div className="auth-heading">
          <span className="auth-eyebrow">
            {cadastro
              ? "COMECE SUA JORNADA"
              : "BEM-VINDA DE VOLTA"}
          </span>

          <h1>
            {cadastro
              ? "Crie sua conta"
              : "Bem-vinda ao Lumora"}
          </h1>

          <p>
            {cadastro
              ? "Comece a organizar seu negócio de beleza."
              : "Entre para acessar sua agenda e seus clientes."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form
          className="auth-form"
          onSubmit={enviarFormulario}
        >
          {cadastro && (
            <>
              <label className="auth-field">
                <span>Nome</span>

                <input
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  autoComplete="name"
                />
              </label>

              <label className="auth-field">
                <span>Telefone</span>

                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(event.target.value)
                  }
                  autoComplete="tel"
                />
              </label>
            </>
          )}

          <label className="auth-field">
            <span>E-mail</span>

            <input
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>

            <div className="password-field">
              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                autoComplete={
                  cadastro
                    ? "new-password"
                    : "current-password"
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setMostrarSenha(
                    (atual) => !atual
                  )
                }
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div
              className="auth-message auth-error"
              role="alert"
            >
              {erro}
            </div>
          )}

          {/* MENSAGEM DE SUCESSO */}
          {sucesso && (
            <div
              className="auth-message auth-success"
              role="status"
            >
              {sucesso}
            </div>
          )}

          {/* RECUPERAÇÃO DE SENHA */}
          {!cadastro && (
            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                setSucesso(
                  "A recuperação de senha será adicionada na próxima etapa."
                )
              }
            >
              Esqueci minha senha
            </button>
          )}

          {/* BOTÃO PRINCIPAL */}
          <button
            type="submit"
            className="auth-submit"
            disabled={carregando}
          >
            {carregando ? (
              <>
                <LoaderCircle
                  size={18}
                  className="spin"
                />

                Aguarde...
              </>
            ) : cadastro ? (
              "Criar conta"
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* ALTERNAR LOGIN / CADASTRO */}
        <div className="auth-switch">
          <span>
            {cadastro
              ? "Já possui uma conta?"
              : "Ainda não possui uma conta?"}
          </span>

          <button
            type="button"
            onClick={alternarModo}
          >
            {cadastro
              ? "Entrar"
              : "Criar conta"}
          </button>
        </div>

        {/* ACESSO GRATUITO */}
        <div className="auth-free">
          <span>✦</span>
          Seu acesso é gratuito durante o lançamento.
        </div>
      </div>
    </main>
  );
}
