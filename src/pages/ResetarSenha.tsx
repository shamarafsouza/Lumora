import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type ResetarSenhaProps = {
  onVoltar: () => void;
};

export function ResetarSenha({
  onVoltar,
}: ResetarSenhaProps) {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [
    mostrarConfirmarSenha,
    setMostrarConfirmarSenha,
  ] = useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [sessaoValida, setSessaoValida] =
    useState(false);

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
        setSessaoValida(true);
        setErro("");
      } else {
        setSessaoValida(false);

        setErro(
          "O link de recuperação é inválido ou expirou. Solicite um novo link."
        );
      }
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" &&
          session
        ) {
          setSessaoValida(true);
          setErro("");
        }
      }
    );

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  async function salvarNovaSenha(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!sessaoValida) {
      setErro(
        "Sua sessão de recuperação não é válida. Solicite um novo link."
      );
      return;
    }

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
        "Não foi possível alterar sua senha. O link pode ter expirado. Solicite uma nova recuperação."
      );

      setCarregando(false);
      return;
    }

    setSenha("");
    setConfirmarSenha("");

    setCarregando(false);

    /*
     * Mostra a mensagem de sucesso.
     */
    setSucesso(
      "Senha resetada com sucesso!"
    );

    /*
     * Depois de 2 segundos, encerra a sessão
     * de recuperação e volta automaticamente
     * para a tela de login.
     */
    setTimeout(async () => {
      await supabase.auth.signOut();
      onVoltar();
    }, 2000);
  }

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
            {sucesso
              ? "Tudo certo!"
              : "Crie uma nova senha"}
          </h1>

          <p>
            {sucesso
              ? "Sua senha foi atualizada. Você será redirecionada para o login."
              : "Escolha uma nova senha para continuar usando o Lumora."}
          </p>
        </div>

        {!sucesso ? (
          <form
            className="auth-form"
            onSubmit={salvarNovaSenha}
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
                  disabled={!sessaoValida}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                  disabled={!sessaoValida}
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
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
                  disabled={!sessaoValida}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setMostrarConfirmarSenha(
                      !mostrarConfirmarSenha
                    )
                  }
                  disabled={!sessaoValida}
                  aria-label={
                    mostrarConfirmarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
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

            <button
              type="submit"
              className="auth-submit"
              disabled={
                carregando ||
                !sessaoValida
              }
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
        ) : (
          <div className="auth-form">
            <div className="auth-message auth-success">
              <CheckCircle2 size={20} />

              <span>
                Senha resetada com sucesso!
              </span>
            </div>

            <p
              style={{
                margin: 0,
                textAlign: "center",
                fontFamily:
                  '"DM Sans", sans-serif',
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Redirecionando para o login...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}