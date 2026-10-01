import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type LoginProps = {
  onVoltar: () => void;
  onLogin: () => void;
  modoCadastro?: boolean;
  modoNovaSenha?: boolean;
};

export function Login({
  onVoltar,
  onLogin,
  modoCadastro = false,
  modoNovaSenha = false,
}: LoginProps) {
  const [cadastro, setCadastro] = useState(modoCadastro);

  const [recuperacao, setRecuperacao] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] =
    useState(false);

  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  /* =====================================================
     LOGIN
     ===================================================== */

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

  /* =====================================================
     CADASTRO
     ===================================================== */

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
        await supabase
          .from("profiles")
          .insert({
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

  /* =====================================================
     ENVIAR E-MAIL DE RECUPERAÇÃO
     ===================================================== */

  async function enviarRecuperacao() {
    setErro("");
    setSucesso("");

    if (!email.trim()) {
      setErro(
        "Digite o e-mail cadastrado no Lumora."
      );
      return;
    }

    setCarregando(true);

    const siteUrl =
      import.meta.env.VITE_SITE_URL ||
      window.location.origin;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: siteUrl,
        }
      );

    if (error) {
      console.error(
        "Erro na recuperação:",
        error
      );

      setErro(
        "Não foi possível enviar o e-mail de recuperação. Verifique o endereço informado."
      );

      setCarregando(false);
      return;
    }

    setSucesso(
      "Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada."
    );

    setCarregando(false);
  }

  /* =====================================================
     ALTERAR NOVA SENHA
     ===================================================== */

  async function atualizarSenha() {
    setErro("");
    setSucesso("");

    if (senha.length < 6) {
      setErro(
        "A nova senha precisa ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro(
        "As senhas não coincidem."
      );
      return;
    }

    setCarregando(true);

    const { error } =
      await supabase.auth.updateUser({
        password: senha,
      });

    if (error) {
      console.error(
        "Erro ao atualizar senha:",
        error
      );

      setErro(
        "Não foi possível alterar sua senha. Tente novamente."
      );

      setCarregando(false);
      return;
    }

    setSenha("");
    setConfirmarSenha("");

    setSucesso(
      "Sua senha foi alterada com sucesso!"
    );

    setCarregando(false);
  }

  /* =====================================================
     SUBMIT
     ===================================================== */

  async function enviarFormulario(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (carregando) return;

    if (modoNovaSenha) {
      await atualizarSenha();
      return;
    }

    if (recuperacao) {
      await enviarRecuperacao();
      return;
    }

    if (cadastro) {
      await criarConta();
      return;
    }

    await entrar();
  }

  /* =====================================================
     VOLTAR PARA LOGIN
     ===================================================== */

  function voltarParaLogin() {
    setRecuperacao(false);
    setCadastro(false);

    setErro("");
    setSucesso("");

    setSenha("");
    setConfirmarSenha("");

    setMostrarSenha(false);
    setMostrarConfirmarSenha(false);
  }

  /* =====================================================
     ALTERNAR LOGIN / CADASTRO
     ===================================================== */

  function alternarCadastro() {
    setCadastro((atual) => !atual);

    setRecuperacao(false);

    setErro("");
    setSucesso("");

    setSenha("");
    setConfirmarSenha("");
  }

  /* =====================================================
     NOVA SENHA
     ===================================================== */

  if (modoNovaSenha) {
    return (
      <main className="auth-page">
        <button
          type="button"
          className="auth-back"
          onClick={onVoltar}
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>

        <div className="auth-card">
          <div className="auth-brand">
            <img
              src="/lumora.png"
              alt="Lumora"
              className="auth-logo"
            />
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">
              RECUPERAÇÃO DE SENHA
            </span>

            <h1>
              Crie uma nova senha
            </h1>

            <p>
              Escolha uma nova senha para
              continuar usando o Lumora.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={enviarFormulario}
          >
            <label className="auth-field">
              <span>Nova senha</span>

              <div className="password-field">
                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  placeholder="Digite sua nova senha"
                  value={senha}
                  onChange={(event) =>
                    setSenha(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>

            <label className="auth-field">
              <span>
                Confirmar nova senha
              </span>

              <div className="password-field">
                <input
                  type={
                    mostrarConfirmarSenha
                      ? "text"
                      : "password"
                  }
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setMostrarConfirmarSenha(
                      !mostrarConfirmarSenha
                    )
                  }
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
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
                <CheckCircle2 size={16} />
                <span>{sucesso}</span>
              </div>
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
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </button>
          </form>

          {sucesso && (
            <button
              type="button"
              className="auth-recovery-back"
              onClick={() => {
                onLogin();
              }}
            >
              Voltar para o Lumora
            </button>
          )}
        </div>
      </main>
    );
  }

  /* =====================================================
     RECUPERAÇÃO
     ===================================================== */

  if (recuperacao) {
    return (
      <main className="auth-page">
        <button
          type="button"
          className="auth-back"
          onClick={onVoltar}
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>

        <div className="auth-card">
          <div className="auth-brand">
            <img
              src="/lumora.png"
              alt="Lumora"
              className="auth-logo"
            />
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">
              RECUPERAÇÃO DE SENHA
            </span>

            <h1>
              Esqueceu sua senha?
            </h1>

            <p>
              Informe seu e-mail e enviaremos
              um link para você criar uma nova
              senha.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={enviarFormulario}
          >
            <label className="auth-field">
              <span>E-mail</span>

              <div className="auth-input-icon">
                <Mail size={17} />

                <input
                  type="email"
                  placeholder="seuemail@email.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                />
              </div>
            </label>

            {erro && (
              <div className="auth-message auth-error">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="auth-message auth-success">
                <CheckCircle2 size={16} />
                <span>{sucesso}</span>
              </div>
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
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </button>
          </form>

          <button
            type="button"
            className="auth-recovery-back"
            onClick={voltarParaLogin}
          >
            <ArrowLeft size={15} />
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     LOGIN / CADASTRO
     ===================================================== */

  return (
    <main className="auth-page">
      <button
        type="button"
        className="auth-back"
        onClick={onVoltar}
      >
        <ArrowLeft size={18} />
        <span>Voltar</span>
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <img
            src="/lumora.png"
            alt="Lumora"
            className="auth-logo"
          />
        </div>

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
                    setNome(
                      event.target.value
                    )
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
                    setTelefone(
                      event.target.value
                    )
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
                setEmail(
                  event.target.value
                )
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
                  setSenha(
                    event.target.value
                  )
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
                    !mostrarSenha
                  )
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
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
              <CheckCircle2 size={16} />
              <span>{sucesso}</span>
            </div>
          )}

          {!cadastro && (
            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setRecuperacao(true);
                setErro("");
                setSucesso("");
              }}
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
            type="button"
            onClick={alternarCadastro}
          >
            {cadastro
              ? "Entrar"
              : "Criar conta"}
          </button>
        </div>

        <div className="auth-free">
          <span>✦</span>
          Seu acesso é gratuito durante o lançamento.
        </div>
      </div>
    </main>
  );
}