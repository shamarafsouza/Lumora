import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
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

    if (!email || !senha) {
      setErro("Preencha seu e-mail e sua senha.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
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
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
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
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          nome: nome.trim(),
          telefone: telefone.trim() || null,
        });

      if (profileError && profileError.code !== "23505") {
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

    if (cadastro) {
      await criarConta();
    } else {
      await entrar();
    }
  }

  return (
    <main className="auth-page">
      <button className="auth-back" onClick={onVoltar}>
        <ArrowLeft size={18} />
        Voltar
      </button>

        <div className="auth-brand">
        <img
            src="/lumora.png"
            alt="Lumora"
            className="auth-logo"
        />
        </div>

        <div className="auth-heading">
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

        <form onSubmit={enviarFormulario}>
          {cadastro && (
            <>
              <label>
                Nome

                <input
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                />
              </label>

              <label>
                Telefone

                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(event.target.value)
                  }
                />
              </label>
            </>
          )}

          <label>
            E-mail

            <input
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Senha

            <div className="password-field">
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />

              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
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

          {erro && (
            <div className="auth-message auth-error">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="auth-message auth-success">
              {sucesso}
            </div>
          )}

          {!cadastro && (
            <button
              type="button"
              className="forgot-password"
              onClick={() => setSucesso("A recuperação de senha será adicionada na próxima etapa.")}
            >
              Esqueci minha senha
            </button>
          )}

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

        <div className="auth-switch">
          <span>
            {cadastro
              ? "Já possui uma conta?"
              : "Ainda não possui uma conta?"}
          </span>

          <button
            onClick={() => {
              setCadastro(!cadastro);
              setErro("");
              setSucesso("");
            }}
          >
            {cadastro ? "Entrar" : "Criar conta"}
          </button>
        </div>

        <div className="auth-free">
          ✦ Seu acesso é gratuito durante o lançamento.
        </div>
      </div>
    </main>
  );
}