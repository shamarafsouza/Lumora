import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";

type InicioProps = {
  onEntrar: () => void;
  onCriarConta: () => void;
};

export function Inicio({ onEntrar, onCriarConta }: InicioProps) {
  return (
    <main className="landing-page">
      <div className="landing-glow" />

      <header className="landing-header">
        <div className="brand-mark">L</div>

        <span className="brand-name">LUMORA</span>
      </header>

      <section className="landing-hero">
        <div className="landing-badge">
          ✦ ACESSO GRATUITO NO LANÇAMENTO
        </div>

        <h1>
          Seu negócio de beleza,
          <span> mais organizado.</span>
        </h1>

        <p>
          Agenda, clientes, serviços e financeiro em um só lugar,
          feito para profissionais de beleza.
        </p>

        <div className="landing-actions">
          <button
            className="primary-button"
            onClick={onCriarConta}
          >
            Criar minha conta
            <ArrowRight size={18} />
          </button>

          <button
            className="secondary-button"
            onClick={onEntrar}
          >
            Já tenho uma conta
          </button>
        </div>

        <div className="free-notice">
          <strong>Comece gratuitamente</strong>

          <p>
            O Lumora está gratuito durante o período de lançamento.
            Futuramente, poderá haver um pequeno ajuste de preço para
            manter e evoluir a plataforma. Você será avisada antes
            de qualquer mudança.
          </p>
        </div>
      </section>

      <section className="landing-features">
        <div>
          <CalendarDays />
          <span>Agenda</span>
        </div>

        <div>
          <Users />
          <span>Clientes</span>
        </div>

        <div>
          <Sparkles />
          <span>Serviços</span>
        </div>

        <div>
          <ChartNoAxesColumnIncreasing />
          <span>Financeiro</span>
        </div>
      </section>

      <p className="landing-footer">
        Lumora · Gestão para profissionais de beleza
      </p>
    </main>
  );
}