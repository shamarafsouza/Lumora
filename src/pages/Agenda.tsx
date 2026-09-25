import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Plus,
  X,
  LoaderCircle,
  Check,
  Settings,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import Jornada from "./Jornada";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
};

type Servico = {
  id: string;
  nome: string;
  categoria: string | null;
  duracao: number;
  preco: number;
};

type Produto = {
  id: string;
  nome: string;
  quantidade_embalagem: number;
  unidade: "g" | "ml" | "un";
  preco_compra: number;
};

type Agendamento = {
  id: string;
  profissional_id: string;
  cliente_id: string;
  servico_id: string;
  data: string;
  horario: string;
  status:
    | "confirmado"
    | "pendente"
    | "concluido"
    | "cancelado";
};

type DiaSemana = {
  data: Date;
  nome: string;
};

function inicioDaSemana(data: Date) {
  const resultado = new Date(data);
  const dia = resultado.getDay();

  const diferenca = dia === 0 ? -6 : 1 - dia;

  resultado.setDate(resultado.getDate() + diferenca);
  resultado.setHours(0, 0, 0, 0);

  return resultado;
}

function mesmaData(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatarDiaCompleto(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatarDataBanco(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function nomeStatus(status: Agendamento["status"]) {
  if (status === "pendente") return "Pendente";
  if (status === "concluido") return "Concluído";
  if (status === "cancelado") return "Cancelado";

  return "Confirmado";
}

export function Agenda() {
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);

  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicoProdutos, setServicoProdutos] = useState<Record<string, string[]>>({});
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [horario, setHorario] = useState("08:00");

  const [status, setStatus] =
    useState<"confirmado" | "pendente">("confirmado");

  const [salvando, setSalvando] = useState(false);

  const [selecionado, setSelecionado] =
    useState<Agendamento | null>(null);

  const [jornadaAberta, setJornadaAberta] =
    useState(false);

  /* =========================
     CONCLUSÃO DO ATENDIMENTO
     ========================= */

  const [conclusaoAberta, setConclusaoAberta] = useState(false);
  const [valorRecebido, setValorRecebido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [observacoesFinanceiro, setObservacoesFinanceiro] =
    useState("");
  const [salvandoConclusao, setSalvandoConclusao] =
    useState(false);

  const semanaAtual = useMemo(
    () => inicioDaSemana(dataSelecionada),
    [dataSelecionada]
  );

  const dias = useMemo<DiaSemana[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = new Date(semanaAtual);

      data.setDate(semanaAtual.getDate() + index);

      return {
        data,
        nome: data
          .toLocaleDateString("pt-BR", {
            weekday: "short",
          })
          .replace(".", "")
          .slice(0, 3),
      };
    });
  }, [semanaAtual]);

  const horarios = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  /* =========================
     CARREGAR DADOS
     ========================= */

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setCarregando(false);
      return;
    }

    const dataBanco = formatarDataBanco(dataSelecionada);

    const [
      clientesResponse,
      servicosResponse,
      produtosResponse,
      vinculosResponse,
      agendaResponse,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, telefone")
        .eq("profissional_id", user.id)
        .order("nome"),

      supabase
        .from("servicos")
        .select("id, nome, categoria, duracao, preco")
        .eq("profissional_id", user.id)
        .order("categoria", {
          ascending: true,
        })
        .order("nome", {
          ascending: true,
        }),

      supabase
        .from("produtos")
        .select("id, nome, quantidade_embalagem, unidade, preco_compra")
        .eq("profissional_id", user.id)
        .order("nome"),

      supabase
        .from("servico_produtos")
        .select("servico_id, produto_id")
        .eq("profissional_id", user.id),

      supabase
        .from("agendamentos")
        .select(
          "id, profissional_id, cliente_id, servico_id, data, horario, status"
        )
        .eq("profissional_id", user.id)
        .eq("data", dataBanco)
        .neq("status", "cancelado")
        .order("horario"),
    ]);

    if (clientesResponse.error) {
      console.error(
        "Erro ao carregar clientes:",
        clientesResponse.error
      );

      setErro("Não foi possível carregar suas clientes.");
      setCarregando(false);
      return;
    }

    if (servicosResponse.error) {
      console.error(
        "Erro ao carregar serviços:",
        servicosResponse.error
      );

      setErro("Não foi possível carregar seus serviços.");
      setCarregando(false);
      return;
    }

    if (produtosResponse.error) {
      console.error(
        "Erro ao carregar produtos:",
        produtosResponse.error
      );

      setErro("Não foi possível carregar os produtos usados nos serviços.");
      setCarregando(false);
      return;
    }

    if (vinculosResponse.error) {
      console.error(
        "Erro ao carregar produtos dos serviços:",
        vinculosResponse.error
      );

      setErro("Não foi possível carregar os produtos dos serviços.");
      setCarregando(false);
      return;
    }

    if (agendaResponse.error) {
      console.error(
        "Erro ao carregar agendamentos:",
        agendaResponse.error
      );

      setErro("Não foi possível carregar sua agenda.");
      setCarregando(false);
      return;
    }

    setClientes(clientesResponse.data ?? []);

    setServicos(
      (servicosResponse.data ?? []).map((servico) => ({
        ...servico,
        duracao: Number(servico.duracao),
        preco: Number(servico.preco),
      }))
    );

    setProdutos(
      (produtosResponse.data ?? []).map((produto) => ({
        ...produto,
        quantidade_embalagem: Number(produto.quantidade_embalagem),
        preco_compra: Number(produto.preco_compra),
      }))
    );

    const mapaProdutos: Record<string, string[]> = {};

    (vinculosResponse.data ?? []).forEach((vinculo) => {
      if (!mapaProdutos[vinculo.servico_id]) {
        mapaProdutos[vinculo.servico_id] = [];
      }

      mapaProdutos[vinculo.servico_id].push(vinculo.produto_id);
    });

    setServicoProdutos(mapaProdutos);
    setAgendamentos(agendaResponse.data ?? []);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, [dataSelecionada]);

  /* =========================
     ATUALIZAR MODAL
     ========================= */

  async function atualizarDadosModal() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      return false;
    }

    const [
      clientesResponse,
      servicosResponse,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, telefone")
        .eq("profissional_id", user.id)
        .order("nome"),

      supabase
        .from("servicos")
        .select("id, nome, categoria, duracao, preco")
        .eq("profissional_id", user.id)
        .order("categoria", {
          ascending: true,
        })
        .order("nome", {
          ascending: true,
        }),
    ]);

    if (clientesResponse.error) {
      console.error(
        "Erro ao atualizar clientes:",
        clientesResponse.error
      );

      setErro("Não foi possível carregar suas clientes.");
      return false;
    }

    if (servicosResponse.error) {
      console.error(
        "Erro ao atualizar serviços:",
        servicosResponse.error
      );

      setErro("Não foi possível carregar seus serviços.");
      return false;
    }

    setClientes(clientesResponse.data ?? []);

    setServicos(
      (servicosResponse.data ?? []).map((servico) => ({
        ...servico,
        duracao: Number(servico.duracao),
        preco: Number(servico.preco),
      }))
    );

    return true;
  }

  /* =========================
     NOVO AGENDAMENTO
     ========================= */

  async function abrirAgendamento(horarioInicial?: string) {
    setErro("");

    setClienteId("");
    setServicoId("");
    setHorario(horarioInicial ?? "08:00");
    setStatus("confirmado");

    const atualizado = await atualizarDadosModal();

    if (!atualizado) {
      return;
    }

    setModalAberto(true);
  }

  function fecharAgendamento() {
    if (salvando) return;

    setModalAberto(false);
    setErro("");
  }

  async function salvarAgendamento(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    if (!clienteId) {
      setErro("Selecione uma cliente.");
      return;
    }

    if (!servicoId) {
      setErro("Selecione um serviço.");
      return;
    }

    setSalvando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setSalvando(false);
      return;
    }

    const dataBanco = formatarDataBanco(dataSelecionada);

    const horarioExistente = agendamentos.some(
      (agendamento) =>
        agendamento.horario.slice(0, 5) === horario
    );

    if (horarioExistente) {
      setErro("Já existe um atendimento nesse horário.");
      setSalvando(false);
      return;
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .insert({
        profissional_id: user.id,
        cliente_id: clienteId,
        servico_id: servicoId,
        data: dataBanco,
        horario,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Erro ao criar agendamento:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível criar o agendamento."
      );

      setSalvando(false);
      return;
    }

    setAgendamentos((atual) =>
      [...atual, data].sort((a, b) =>
        a.horario.localeCompare(b.horario)
      )
    );

    setSalvando(false);
    setModalAberto(false);
  }

  /* =========================
     BUSCAS
     ========================= */

  function obterCliente(id: string) {
    return clientes.find(
      (cliente) => cliente.id === id
    );
  }

  function obterServico(id: string) {
    return servicos.find(
      (servico) => servico.id === id
    );
  }

  const agendamentoSelecionado = selecionado
    ? {
        agendamento: selecionado,
        cliente: obterCliente(
          selecionado.cliente_id
        ),
        servico: obterServico(
          selecionado.servico_id
        ),
      }
    : null;

  /* =========================
     ABRIR CONCLUSÃO
     ========================= */

  function abrirConclusao() {
    if (!selecionado) return;

    const servico = obterServico(
      selecionado.servico_id
    );

    setValorRecebido(
      servico ? String(servico.preco) : ""
    );

    setFormaPagamento("pix");
    setObservacoesFinanceiro("");
    setErro("");

    setConclusaoAberta(true);
  }

  function fecharConclusao() {
    if (salvandoConclusao) return;

    setConclusaoAberta(false);
    setErro("");
  }

  /* =========================
     CONCLUIR ATENDIMENTO
     ========================= */

  function calcularCustoMaterial(servicoId: string) {
    const produtoIds = servicoProdutos[servicoId] ?? [];

    return produtoIds.reduce((total, produtoId) => {
      const produto = produtos.find((item) => item.id === produtoId);

      if (!produto || produto.quantidade_embalagem <= 0 || produto.preco_compra <= 0) {
        return total;
      }

      // Estimativa automática do Lumora:
      // produtos medidos em g/ml usam 5% da embalagem por atendimento;
      // produtos em unidade usam 1 unidade.
      const quantidadeEstimada =
        produto.unidade === "un"
          ? 1
          : Math.min(produto.quantidade_embalagem, produto.quantidade_embalagem * 0.05);

      const custoUnitario =
        produto.preco_compra / produto.quantidade_embalagem;

      return total + custoUnitario * quantidadeEstimada;
    }, 0);
  }

  async function concluirAtendimento(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selecionado) return;

    setErro("");

    const valor = Number(
      valorRecebido.replace(",", ".")
    );

    if (Number.isNaN(valor) || valor < 0) {
      setErro("Informe um valor recebido válido.");
      return;
    }

    setSalvandoConclusao(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setSalvandoConclusao(false);
      return;
    }

    /*
     * Primeiro verificamos se já existe um
     * lançamento financeiro para este atendimento.
     */
    const { data: financeiroExistente, error: consultaError } =
      await supabase
        .from("financeiro_atendimentos")
        .select("id")
        .eq("agendamento_id", selecionado.id)
        .maybeSingle();

    if (consultaError) {
      console.error(
        "Erro ao verificar financeiro:",
        consultaError
      );

      setErro(
        "Não foi possível verificar o financeiro deste atendimento."
      );

      setSalvandoConclusao(false);
      return;
    }

    if (financeiroExistente) {
      setErro(
        "Este atendimento já possui um lançamento financeiro."
      );

      setSalvandoConclusao(false);
      return;
    }

    /*
     * Cria o lançamento financeiro.
     */
    const { error: financeiroError } = await supabase
      .from("financeiro_atendimentos")
      .insert({
        profissional_id: user.id,
        agendamento_id: selecionado.id,
        valor_recebido: valor,
        forma_pagamento: formaPagamento,
        custo_material: Number(
          calcularCustoMaterial(selecionado.servico_id).toFixed(2)
        ),
        observacoes:
          observacoesFinanceiro.trim() || null,
      });

    if (financeiroError) {
      console.error(
        "Erro ao registrar financeiro:",
        financeiroError
      );

      /*
       * Se o índice único detectar uma duplicação,
       * tratamos como atendimento já lançado.
       */
      if (financeiroError.code === "23505") {
        setErro(
          "Este atendimento já possui um lançamento financeiro."
        );
      } else {
        setErro(
          financeiroError.message ||
            "Não foi possível registrar o financeiro."
        );
      }

      setSalvandoConclusao(false);
      return;
    }

    /*
     * Depois do financeiro salvo, marca o
     * atendimento como concluído.
     */
    const { data: agendamentoAtualizado, error: statusError } =
      await supabase
        .from("agendamentos")
        .update({
          status: "concluido",
        })
        .eq("id", selecionado.id)
        .eq("profissional_id", user.id)
        .select()
        .single();

    if (statusError) {
      console.error(
        "Erro ao concluir agendamento:",
        statusError
      );

      /*
       * O financeiro já foi salvo. Então avisamos
       * claramente para não tentar criar outro lançamento.
       */
      setErro(
        "O financeiro foi registrado, mas não foi possível atualizar o status do atendimento. Atualize a página antes de tentar novamente."
      );

      setSalvandoConclusao(false);
      return;
    }

    /*
     * Atualiza o atendimento na tela.
     */
    setAgendamentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? agendamentoAtualizado
          : item
      )
    );

    setSelecionado(agendamentoAtualizado);
    setConclusaoAberta(false);
    setSalvandoConclusao(false);
    setErro("");
  }

  return (
    <main className="page agenda-page">
      <header className="top">
        <div>
          <h1>Lumora</h1>

          <p>
            {formatarDiaCompleto(dataSelecionada)}
          </p>
        </div>

        <div className="agenda-header-actions">
          <button
            type="button"
            className="agenda-settings"
            onClick={() => setJornadaAberta(true)}
            aria-label="Configurar jornada"
          >
            <Settings size={19} />
          </button>

          <button
            type="button"
            className="agenda-add"
            onClick={() => abrirAgendamento()}
            aria-label="Novo agendamento"
          >
            <Plus size={20} />
          </button>

          <div className="avatar">
            LU
          </div>
        </div>
      </header>

      <div className="week">
        {dias.map((dia) => {
          const selecionadoDia = mesmaData(
            dia.data,
            dataSelecionada
          );

          return (
            <button
              key={dia.data.toISOString()}
              type="button"
              className={
                selecionadoDia
                  ? "selected-day"
                  : ""
              }
              onClick={() =>
                setDataSelecionada(dia.data)
              }
            >
              <span>{dia.nome}</span>

              <b>{dia.data.getDate()}</b>
            </button>
          );
        })}
      </div>

      {erro && !modalAberto && !conclusaoAberta && (
        <div className="agenda-error">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="agenda-loading">
          <LoaderCircle
            size={23}
            className="spin"
          />

          <span>
            Carregando agenda...
          </span>
        </div>
      ) : (
        <section className="timeline">
          {horarios.map((horarioHora) => {
            const agendamento =
              agendamentos.find(
                (item) =>
                  item.horario.slice(0, 5) ===
                  horarioHora
              );

            if (!agendamento) {
              return (
                <button
                  type="button"
                  className="available available-button"
                  key={horarioHora}
                  onClick={() =>
                    abrirAgendamento(
                      horarioHora
                    )
                  }
                >
                  <span>{horarioHora}</span>

                  <b>Disponível</b>
                </button>
              );
            }

            const cliente = obterCliente(
              agendamento.cliente_id
            );

            const servico = obterServico(
              agendamento.servico_id
            );

            return (
              <button
                type="button"
                key={agendamento.id}
                className={`appointment ${agendamento.status}`}
                onClick={() =>
                  setSelecionado(agendamento)
                }
              >
                <span className="slot-time">
                  {horarioHora}
                </span>

                <div>
                  <strong>
                    {cliente?.nome ??
                      "Cliente"}
                  </strong>

                  <small>
                    {servico?.nome ??
                      "Serviço"}
                  </small>
                </div>

                <em>
                  {nomeStatus(
                    agendamento.status
                  )}
                </em>
              </button>
            );
          })}
        </section>
      )}

      {/* =========================
          MODAL NOVO AGENDAMENTO
          ========================= */}

      {modalAberto && (
        <div
          className="agenda-modal-backdrop"
          onClick={fecharAgendamento}
        >
          <section
            className="agenda-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="agenda-modal-close"
              onClick={fecharAgendamento}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>

            <div className="agenda-modal-handle" />

            <h2>Agendar atendimento</h2>

            <p>
              {formatarDiaCompleto(
                dataSelecionada
              )}
            </p>

            {clientes.length === 0 ? (
              <div className="agenda-empty">
                <strong>
                  Nenhuma cliente cadastrada
                </strong>

                <span>
                  Cadastre uma cliente antes
                  de criar um agendamento.
                </span>
              </div>
            ) : servicos.length === 0 ? (
              <div className="agenda-empty">
                <strong>
                  Nenhum serviço cadastrado
                </strong>

                <span>
                  Cadastre um serviço antes
                  de criar um agendamento.
                </span>
              </div>
            ) : (
              <form
                onSubmit={salvarAgendamento}
                className="agenda-form"
              >
                <label>
                  Cliente

                  <select
                    value={clienteId}
                    onChange={(event) =>
                      setClienteId(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecione uma cliente
                    </option>

                    {clientes.map(
                      (cliente) => (
                        <option
                          key={cliente.id}
                          value={cliente.id}
                        >
                          {cliente.nome}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Serviço

                  <select
                    value={servicoId}
                    onChange={(event) =>
                      setServicoId(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecione um serviço
                    </option>

                    {servicos.map(
                      (servico) => (
                        <option
                          key={servico.id}
                          value={servico.id}
                        >
                          {servico.nome} —{" "}
                          {formatarValor(
                            Number(
                              servico.preco
                            )
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Horário

                  <select
                    value={horario}
                    onChange={(event) =>
                      setHorario(
                        event.target.value
                      )
                    }
                  >
                    {horarios.map(
                      (hora) => (
                        <option
                          key={hora}
                          value={hora}
                        >
                          {hora}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Status

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as
                          | "confirmado"
                          | "pendente"
                      )
                    }
                  >
                    <option value="confirmado">
                      Confirmado
                    </option>

                    <option value="pendente">
                      Pendente
                    </option>
                  </select>
                </label>

                {erro && (
                  <div className="agenda-error">
                    {erro}
                  </div>
                )}

                <div className="agenda-modal-actions">
                  <button
                    type="button"
                    className="agenda-cancel"
                    onClick={fecharAgendamento}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="agenda-save"
                    disabled={salvando}
                  >
                    {salvando ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="spin"
                        />

                        Salvando...
                      </>
                    ) : (
                      "Agendar"
                    )}
                  </button>
                </div>
              </form>
            )}

            {(clientes.length === 0 ||
              servicos.length === 0) && (
              <button
                type="button"
                className="agenda-cancel full"
                onClick={fecharAgendamento}
              >
                Fechar
              </button>
            )}
          </section>
        </div>
      )}

      {/* =========================
          DETALHES DO AGENDAMENTO
          ========================= */}

      {agendamentoSelecionado &&
        !conclusaoAberta && (
          <div
            className="sheet-backdrop"
            onClick={() =>
              setSelecionado(null)
            }
          >
            <section
              className="sheet"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="close"
                onClick={() =>
                  setSelecionado(null)
                }
              >
                <X />
              </button>

              <div className="handle" />

              <h2>
                {agendamentoSelecionado
                  .cliente?.nome ??
                  "Cliente"}
              </h2>

              <p className="muted">
                {formatarDiaCompleto(
                  dataSelecionada
                )}{" "}
                às{" "}
                {agendamentoSelecionado.agendamento.horario.slice(
                  0,
                  5
                )}{" "}
                •{" "}
                {nomeStatus(
                  agendamentoSelecionado
                    .agendamento.status
                )}
              </p>

              <div className="detail">
                <span>
                  Procedimento:
                </span>

                <b>
                  {agendamentoSelecionado
                    .servico?.nome ??
                    "—"}
                </b>

                <span>
                  Duração:
                </span>

                <b>
                  {agendamentoSelecionado
                    .servico?.duracao ??
                    0}{" "}
                  minutos
                </b>
              </div>

              <div className="money">
                <div>
                  <span>
                    Valor cobrado
                  </span>

                  <b>
                    {formatarValor(
                      Number(
                        agendamentoSelecionado
                          .servico?.preco ??
                          0
                      )
                    )}
                  </b>
                </div>
              </div>

              {agendamentoSelecionado
                .cliente?.telefone && (
                <a
                  className="whatsapp"
                  href={`https://wa.me/${agendamentoSelecionado.cliente.telefone.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Olá, ${agendamentoSelecionado.cliente.nome}! 💅 Passando para confirmar seu horário hoje às ${agendamentoSelecionado.agendamento.horario.slice(
                      0,
                      5
                    )}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle />

                  Enviar lembrete no WhatsApp
                </a>
              )}

              <div className="sheet-actions">
                <button
                  type="button"
                  onClick={() =>
                    setSelecionado(null)
                  }
                >
                  Fechar
                </button>

                {agendamentoSelecionado
                  .agendamento.status !==
                  "concluido" && (
                  <button
                    type="button"
                    onClick={abrirConclusao}
                  >
                    <Check
                      size={15}
                    />{" "}
                    Concluir
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

      {/* =========================
          MODAL CONCLUIR ATENDIMENTO
          ========================= */}

      {conclusaoAberta &&
        agendamentoSelecionado && (
          <div
            className="agenda-modal-backdrop"
            onClick={fecharConclusao}
          >
            <section
              className="agenda-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="agenda-modal-close"
                onClick={fecharConclusao}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>

              <div className="agenda-modal-handle" />

              <h2>
                Concluir atendimento
              </h2>

              <p>
                {agendamentoSelecionado
                  .cliente?.nome ??
                  "Cliente"}{" "}
                •{" "}
                {agendamentoSelecionado
                  .servico?.nome ??
                  "Serviço"}
              </p>

              <form
                className="agenda-form"
                onSubmit={
                  concluirAtendimento
                }
              >
                <label>
                  Valor recebido

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 150,00"
                    value={valorRecebido}
                    onChange={(event) =>
                      setValorRecebido(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Forma de pagamento

                  <select
                    value={formaPagamento}
                    onChange={(event) =>
                      setFormaPagamento(
                        event.target.value
                      )
                    }
                  >
                    <option value="pix">
                      Pix
                    </option>

                    <option value="dinheiro">
                      Dinheiro
                    </option>

                    <option value="cartao_credito">
                      Cartão de crédito
                    </option>

                    <option value="cartao_debito">
                      Cartão de débito
                    </option>

                    <option value="outro">
                      Outro
                    </option>
                  </select>
                </label>

                <label>
                  Observação

                  <textarea
                    rows={3}
                    placeholder="Opcional"
                    value={
                      observacoesFinanceiro
                    }
                    onChange={(event) =>
                      setObservacoesFinanceiro(
                        event.target.value
                      )
                    }
                  />
                </label>

                {erro && (
                  <div className="agenda-error">
                    {erro}
                  </div>
                )}

                <div className="agenda-modal-actions">
                  <button
                    type="button"
                    className="agenda-cancel"
                    onClick={fecharConclusao}
                    disabled={
                      salvandoConclusao
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="agenda-save"
                    disabled={
                      salvandoConclusao
                    }
                  >
                    {salvandoConclusao ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="spin"
                        />

                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check size={17} />

                        Concluir
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

      {/* =========================
          CONFIGURAÇÃO DA JORNADA
          ========================= */}

      {jornadaAberta && (
        <div
          className="jornada-modal-backdrop"
          onClick={() => setJornadaAberta(false)}
        >
          <section
            className="jornada-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <Jornada
              onClose={() => setJornadaAberta(false)}
            />
          </section>
        </div>
      )}
    </main>
  );
}
