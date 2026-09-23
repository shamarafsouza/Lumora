import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [cadastro, setCadastro] = useState(modoCadastro);

  return (
    <main className="auth-page">
      <button className="auth-back" onClick={onVoltar}>
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">L</div>

          <span>LUMORA</span>
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

        {cadastro && (
          <label>
            Nome
            <input
              type="text"
              placeholder="Seu nome"
            />
          </label>
        )}

        <label>
          E-mail
          <input
            type="email"
            placeholder="seuemail@email.com"
          />
        </label>

        <label>
          Senha

          <div className="password-field">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Digite sua senha"
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </label>

        {!cadastro && (
          <button className="forgot-password">
            Esqueci minha senha
          </button>
        )}

        <button
          className="auth-submit"
          onClick={onLogin}
        >
          {cadastro ? "Criar conta" : "Entrar"}
        </button>

        <div className="auth-switch">
          <span>
            {cadastro
              ? "Já possui uma conta?"
              : "Ainda não possui uma conta?"}
          </span>

          <button
            onClick={() => setCadastro(!cadastro)}
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