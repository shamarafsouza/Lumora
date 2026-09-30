import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Sparkles,
  Users,
} from "lucide-react";

type InicioProps = {
  onEntrar: () => void;
  onCriarConta: () => void;
};

export function Inicio({
  onEntrar,
  onCriarConta,
}: InicioProps) {
  return (
    <main className="landing-page">
      <div className="landing-glow" />

      <header className="landing-header">
        <img
          src="/lumora.png"
          alt="Lumora — Gestão para profissionais de beleza"
          className="landing-logo"
        />
      </header>

      <section className="landing-hero">
        <div className="landing-badge">
          <span>✦</span>
          ACESSO GRATUITO NO LANÇAMENTO
        </div>

        <h1>
          Seu negócio de beleza,
          <em> mais organizado.</em>
        </h1>

        <p className="landing-description">
          Agenda, clientes, serviços e financeiro em um só
          lugar, feito para profissionais de beleza.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onCriarConta}
          >
            <span>Criar minha conta</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onEntrar}
          >
            Já tenho uma conta
          </button>
        </div>

        <div className="free-notice">
          <div className="free-notice-title">
            <span>✦</span>
            <strong>Comece gratuitamente</strong>
          </div>

          <p>
            O Lumora está gratuito durante o período de
            lançamento. Futuramente, poderá haver um pequeno
            ajuste de preço para manter e evoluir a
            plataforma. Você será avisada antes de qualquer
            mudança.
          </p>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <CalendarDays size={19} />
          </div>
          <span>Agenda</span>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon">
            <Users size={19} />
          </div>
          <span>Clientes</span>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon">
            <Sparkles size={19} />
          </div>
          <span>Serviços</span>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon">
            <ChartNoAxesColumnIncreasing size={19} />
          </div>
          <span>Financeiro</span>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Lumora</span>
        <span className="landing-footer-dot">·</span>
        <span>Gestão para profissionais de beleza</span>
      </footer>
    </main>
  );
}
