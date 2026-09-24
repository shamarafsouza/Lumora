import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Sparkles,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "./Dashboard.css";

type Cliente = {
  id: string;
  nome: string;
};

type Servico = {
  id: string;
  nome: string;
  preco: number;
};

type Agendamento = {
  id: string;
  cliente_id: string;
  servico_id: string;
  data: string;
  horario: string;
  status: "confirmado" | "pendente" | "concluido" | "cancelado" | string;
};

type DashboardProps = {
  onNavigate: (
    page: "agenda" | "financeiro" | "servicos" | "clientes"
  ) => void;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataCompleta(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function obterSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function formatarHorario(horario: string) {
  return horario.slice(0, 5);
}

function formatarStatus(status: string) {
  switch (status) {
    case "confirmado":
      return "Confirmado";

    case "pendente":
      return "Pendente";

    case "concluido":
      return "Concluído";

    case "cancelado":
      return "Cancelado";

    default:
      return status;
  }
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [nomeProfissional, setNomeProfissional] = useState("Profissional");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const hoje = useMemo(() => {
    const data = new Date();

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }, []);

  const dataAtual = useMemo(() => new Date(), []);

  async function carregarDashboard() {
    setCarregando(true);
    setErro("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErro("Sua sessão expirou. Entre novamente.");
        return;
      }

      const nomeMetadata =
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Profissional";

      setNomeProfissional(nomeMetadata);

      const [
        clientesResponse,
        servicosResponse,
        agendamentosResponse,
      ] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome")
          .eq("profissional_id", user.id)
          .order("nome", { ascending: true }),

        supabase
          .from("servicos")
          .select("id, nome, preco")
          .eq("profissional_id", user.id)
          .order("nome", { ascending: true }),

        supabase
          .from("agendamentos")
          .select(
            "id, cliente_id, servico_id, data, horario, status"
          )
          .eq("profissional_id", user.id)
          .eq("data", hoje)
          .neq("status", "cancelado")
          .order("horario", { ascending: true }),
      ]);

      if (clientesResponse.error) {
        throw clientesResponse.error;
      }

      if (servicosResponse.error) {
        throw servicosResponse.error;
      }

      if (agendamentosResponse.error) {
        throw agendamentosResponse.error;
      }

      setClientes(clientesResponse.data ?? []);
      setServicos(servicosResponse.data ?? []);
      setAgendamentos(agendamentosResponse.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);

      setErro(
        "Não foi possível carregar os dados do seu dashboard."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const clientesMap = useMemo(() => {
    const mapa = new Map<string, Cliente>();

    clientes.forEach((cliente) => {
      mapa.set(cliente.id, cliente);
    });

    return mapa;
  }, [clientes]);

  const servicosMap = useMemo(() => {
    const mapa = new Map<string, Servico>();

    servicos.forEach((servico) => {
      mapa.set(servico.id, servico);
    });

    return mapa;
  }, [servicos]);

  const proximosAtendimentos = useMemo(() => {
    return agendamentos.filter(
      (agendamento) => agendamento.status !== "concluido"
    );
  }, [agendamentos]);

  const proximoAtendimento = proximosAtendimentos[0];

  const faturamentoPrevisto = useMemo(() => {
    return agendamentos
      .filter(
        (agendamento) =>
          agendamento.status === "confirmado" ||
          agendamento.status === "pendente"
      )
      .reduce((total, agendamento) => {
        const servico = servicosMap.get(agendamento.servico_id);

        return total + Number(servico?.preco ?? 0);
      }, 0);
  }, [agendamentos, servicosMap]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-brand">LUMORA</span>

          <h1>
            {obterSaudacao()},{" "}
            <strong>{nomeProfissional}</strong> ✨
          </h1>

          <p>{formatarDataCompleta(dataAtual)}</p>
        </div>

        <div className="dashboard-avatar">
          {nomeProfissional.charAt(0).toUpperCase()}
        </div>
      </header>

      {erro && (
        <div className="dashboard-error">
          <span>{erro}</span>

          <button onClick={carregarDashboard}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="dashboard-loading">
          <LoaderCircle className="spin" size={25} />

          <span>Carregando seu dia...</span>
        </div>
      ) : (
        <>
          <section className="next-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  SEU DIA
                </span>

                <h2>Próximo atendimento</h2>
              </div>

              <button
                className="section-link"
                onClick={() => onNavigate("agenda")}
              >
                Ver agenda
                <ChevronRight size={15} />
              </button>
            </div>

            {proximoAtendimento ? (
              <button
                className="next-appointment"
                onClick={() => onNavigate("agenda")}
              >
                <div className="next-time">
                  <Clock3 size={16} />

                  <strong>
                    {formatarHorario(
                      proximoAtendimento.horario
                    )}
                  </strong>
                </div>

                <div className="next-info">
                  <strong>
                    {
                      clientesMap.get(
                        proximoAtendimento.cliente_id
                      )?.nome
                    }
                  </strong>

                  <span>
                    {
                      servicosMap.get(
                        proximoAtendimento.servico_id
                      )?.nome
                    }
                  </span>
                </div>

                <span
                  className={`appointment-status ${proximoAtendimento.status}`}
                >
                  {formatarStatus(
                    proximoAtendimento.status
                  )}
                </span>
              </button>
            ) : (
              <button
                className="next-empty"
                onClick={() => onNavigate("agenda")}
              >
                <div className="empty-icon">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <strong>
                    Nenhum atendimento restante hoje
                  </strong>

                  <span>
                    Sua agenda está livre por enquanto.
                  </span>
                </div>

                <ChevronRight size={18} />
              </button>
            )}
          </section>

          <section className="dashboard-metrics">
            <div className="dashboard-metric">
              <div className="metric-icon wine">
                <CalendarDays size={18} />
              </div>

              <span>Hoje</span>

              <strong>
                {agendamentos.length}
              </strong>

              <small>
                {agendamentos.length === 1
                  ? "atendimento"
                  : "atendimentos"}
              </small>
            </div>

            <div className="dashboard-metric">
              <div className="metric-icon green">
                <ChartNoAxesColumnIncreasing size={18} />
              </div>

              <span>Previsto hoje</span>

              <strong className="metric-money">
                {formatarMoeda(faturamentoPrevisto)}
              </strong>

              <small>faturamento</small>
            </div>
          </section>

          <section className="quick-section">
            <div className="section-heading simple">
              <div>
                <span className="section-eyebrow">
                  ACESSO RÁPIDO
                </span>

                <h2>O que você precisa?</h2>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() => onNavigate("agenda")}
              >
                <div className="quick-icon wine">
                  <CalendarPlus size={20} />
                </div>

                <span>
                  Novo
                  <strong>atendimento</strong>
                </span>

                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => onNavigate("clientes")}
              >
                <div className="quick-icon beige">
                  <Users size={20} />
                </div>

                <span>
                  Gerenciar
                  <strong>clientes</strong>
                </span>

                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => onNavigate("servicos")}
              >
                <div className="quick-icon gold">
                  <Sparkles size={20} />
                </div>

                <span>
                  Gerenciar
                  <strong>serviços</strong>
                </span>

                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => onNavigate("financeiro")}
              >
                <div className="quick-icon green">
                  <ChartNoAxesColumnIncreasing size={20} />
                </div>

                <span>
                  Ver
                  <strong>financeiro</strong>
                </span>

                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          <section className="today-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  AGENDA DE HOJE
                </span>

                <h2>Seus atendimentos</h2>
              </div>

              <span className="today-count">
                {agendamentos.length}
              </span>
            </div>

            {agendamentos.length === 0 ? (
              <div className="today-empty">
                <CalendarDays size={20} />

                <span>
                  Você ainda não possui atendimentos
                  agendados para hoje.
                </span>
              </div>
            ) : (
              <div className="today-list">
                {agendamentos.slice(0, 5).map((agendamento) => {
                  const cliente = clientesMap.get(
                    agendamento.cliente_id
                  );

                  const servico = servicosMap.get(
                    agendamento.servico_id
                  );

                  return (
                    <button
                      className="today-card"
                      key={agendamento.id}
                      onClick={() =>
                        onNavigate("agenda")
                      }
                    >
                      <span className="today-time">
                        {formatarHorario(
                          agendamento.horario
                        )}
                      </span>

                      <div className="today-client">
                        <strong>
                          {cliente?.nome ||
                            "Cliente"}
                        </strong>

                        <span>
                          {servico?.nome ||
                            "Serviço"}
                        </span>
                      </div>

                      <div className="today-price">
                        <strong>
                          {formatarMoeda(
                            Number(servico?.preco ?? 0)
                          )}
                        </strong>

                        <small
                          className={
                            agendamento.status
                          }
                        >
                          {formatarStatus(
                            agendamento.status
                          )}
                        </small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dashboard-summary">
            <div>
              <Users size={18} />

              <div>
                <strong>{clientes.length}</strong>

                <span>
                  {clientes.length === 1
                    ? "cliente cadastrado"
                    : "clientes cadastrados"}
                </span>
              </div>
            </div>

            <div>
              <Sparkles size={18} />

              <div>
                <strong>{servicos.length}</strong>

                <span>
                  {servicos.length === 1
                    ? "serviço cadastrado"
                    : "serviços cadastrados"}
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}