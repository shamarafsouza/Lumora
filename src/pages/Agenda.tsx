import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Plus,
  X,
  LoaderCircle,
  Check,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
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

function inicioDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function fimDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 1);
}

function gerarDiasDoCalendario(mes: Date) {
  const primeiroDia = inicioDoMes(mes);
  const inicio = new Date(primeiroDia);
  const diaSemana = inicio.getDay();
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1;

  inicio.setDate(primeiroDia.getDate() - deslocamento);

  return Array.from({ length: 42 }, (_, index) => {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + index);
    return data;
  });
}

function formatarMesAno(data: Date) {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
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
  const [mesCalendario, setMesCalendario] = useState(
    inicioDoMes(hoje)
  );
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [intervaloInicio, setIntervaloInicio] = useState<string | null>(null);
  const [intervaloFim, setIntervaloFim] = useState<string | null>(null);

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

  const diasCalendario = useMemo(
    () => gerarDiasDoCalendario(mesCalendario),
    [mesCalendario]
  );

  const diasSemana = useMemo(() => {
    const inicio = inicioDaSemana(dataSelecionada);

    return Array.from({ length: 7 }, (_, index) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + index);
      return data;
    });
  }, [dataSelecionada]);

  const diasVisiveis = calendarioAberto ? diasCalendario : diasSemana;

  const agendamentosDoDia = useMemo(
    () =>
      agendamentos.filter(
        (agendamento) =>
          agendamento.data === formatarDataBanco(dataSelecionada)
      ),
    [agendamentos, dataSelecionada]
  );

  const atendimentosAtivos = agendamentosDoDia.filter(
    (agendamento) => agendamento.status !== "cancelado"
  ).length;

  const atendimentosConcluidos = agendamentosDoDia.filter(
    (agendamento) => agendamento.status === "concluido"
  ).length;

  function horarioParaMinutos(horario: string) {
    const [hora, minuto] = horario.slice(0, 5).split(":").map(Number);
    return hora * 60 + minuto;
  }

  function estaNoIntervaloAlmoco(horario: string) {
    if (!intervaloInicio || !intervaloFim) return false;

    const atual = horarioParaMinutos(horario);
    const inicio = horarioParaMinutos(intervaloInicio);
    const fim = horarioParaMinutos(intervaloFim);

    return atual >= inicio && atual < fim;
  }

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

  async function carregarIntervaloAlmoco() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("horarios_trabalho")
      .select("intervalo_inicio, intervalo_fim, ativo")
      .eq("profissional_id", user.id)
      .eq("dia_semana", dataSelecionada.getDay() === 0 ? 7 : dataSelecionada.getDay())
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar intervalo de almoço:", error);
      setIntervaloInicio(null);
      setIntervaloFim(null);
      return;
    }

    if (!data?.ativo || !data.intervalo_inicio || !data.intervalo_fim) {
      setIntervaloInicio(null);
      setIntervaloFim(null);
      return;
    }

    setIntervaloInicio(data.intervalo_inicio.slice(0, 5));
    setIntervaloFim(data.intervalo_fim.slice(0, 5));
  }

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

    const inicioMesBanco = formatarDataBanco(inicioDoMes(mesCalendario));
    const fimMesBanco = formatarDataBanco(fimDoMes(mesCalendario));

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
        .gte("data", inicioMesBanco)
        .lt("data", fimMesBanco)
        .neq("status", "cancelado")
        .order("data")
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
  }, [mesCalendario]);

  useEffect(() => {
    carregarIntervaloAlmoco();
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

    const servicoSelecionado = servicos.find(
      (servico) => servico.id === servicoId
    );

    if (!servicoSelecionado) {
      setErro("Não foi possível identificar o serviço selecionado.");
      setSalvando(false);
      return;
    }

    function minutosDoHorario(valor: string) {
      const [horas, minutos] = valor.slice(0, 5).split(":").map(Number);
      return horas * 60 + minutos;
    }

    const inicioNovo = minutosDoHorario(horario);
    const fimNovo =
      inicioNovo + Math.max(Number(servicoSelecionado.duracao) || 60, 1);

    if (intervaloInicio && intervaloFim) {
      const inicioAlmoco = minutosDoHorario(intervaloInicio);
      const fimAlmoco = minutosDoHorario(intervaloFim);

      const entraNoAlmoco =
        inicioNovo < fimAlmoco && fimNovo > inicioAlmoco;

      if (entraNoAlmoco) {
        setErro(
          `Esse atendimento entra no horário de almoço (${intervaloInicio} às ${intervaloFim}). Escolha outro horário.`
        );
        setSalvando(false);
        return;
      }
    }

    const horarioEmConflito = agendamentos.some((agendamento) => {
      const servicoExistente = servicos.find(
        (servico) => servico.id === agendamento.servico_id
      );

      const inicioExistente = minutosDoHorario(agendamento.horario);
      const fimExistente =
        inicioExistente + Math.max(Number(servicoExistente?.duracao) || 60, 1);

      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });

    if (horarioEmConflito) {
      setErro(
        "Esse horário entra em conflito com outro atendimento. Escolha outro horário."
      );
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

  function selecionarDiaCalendario(data: Date) {
    const novoMes = inicioDoMes(data);

    setMesCalendario(novoMes);
    setDataSelecionada(new Date(data));
  }

  function mudarMes(direcao: number) {
    const novoMes = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth() + direcao,
      1
    );

    setMesCalendario(novoMes);
    setDataSelecionada(novoMes);
  }

  function mudarPeriodo(direcao: number) {
    if (calendarioAberto) {
      mudarMes(direcao);
      return;
    }

    const nova = new Date(dataSelecionada);
    nova.setDate(nova.getDate() + 7 * direcao);

    setDataSelecionada(nova);
    setMesCalendario(inicioDoMes(nova));
  }

  function voltarParaHoje() {
    const hojeAtual = new Date();
    hojeAtual.setHours(0, 0, 0, 0);
    setMesCalendario(inicioDoMes(hojeAtual));
    setDataSelecionada(hojeAtual);
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

  async function registrarSaidaEstoque(
    agendamentoId: string,
    servicoId: string,
    profissionalId: string
  ) {
    const produtoIds = servicoProdutos[servicoId] ?? [];

    if (produtoIds.length === 0) {
      return { error: null as any };
    }

    const { data: movimentacoesExistentes, error: consultaError } =
      await supabase
        .from("movimentacoes_produtos")
        .select("produto_id")
        .eq("agendamento_id", agendamentoId)
        .eq("profissional_id", profissionalId);

    if (consultaError) {
      return { error: consultaError };
    }

    const jaRegistrados = new Set(
      (movimentacoesExistentes ?? []).map((item) => item.produto_id)
    );

    const movimentacoes = produtoIds
      .filter((produtoId) => !jaRegistrados.has(produtoId))
      .map((produtoId) => {
        const produto = produtos.find((item) => item.id === produtoId);

        if (!produto || produto.quantidade_embalagem <= 0) {
          return null;
        }

        const quantidadeEstimada =
          produto.unidade === "un"
            ? 1
            : produto.quantidade_embalagem * 0.05;

        return {
          profissional_id: profissionalId,
          produto_id: produtoId,
          tipo: "saida",
          quantidade: Number(quantidadeEstimada.toFixed(3)),
          origem: "atendimento",
          agendamento_id: agendamentoId,
        };
      })
      .filter((item): item is {
        profissional_id: string;
        produto_id: string;
        tipo: string;
        quantidade: number;
        origem: string;
        agendamento_id: string;
      } => item !== null);

    if (movimentacoes.length === 0) {
      return { error: null as any };
    }

    const { error } = await supabase
      .from("movimentacoes_produtos")
      .insert(movimentacoes);

    return { error };
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
     * Registra automaticamente a saída dos produtos usados
     * neste serviço. A mesma estimativa usada no custo do
     * material é usada para o estoque.
     */
    const { error: estoqueError } = await registrarSaidaEstoque(
      selecionado.id,
      selecionado.servico_id,
      user.id
    );

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

    if (estoqueError) {
      console.error(
        "Erro ao registrar saída de estoque:",
        estoqueError
      );

      setErro(
        "Atendimento concluído e financeiro registrado, mas não foi possível registrar o consumo dos produtos no estoque."
      );
      return;
    }

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

      <section className="agenda-calendar">
        <div className="agenda-calendar-header">
          <div className="agenda-calendar-title">
            <CalendarDays size={17} />
            <strong>{formatarMesAno(mesCalendario)}</strong>
          </div>

          <div className="agenda-calendar-controls">
            <button
              type="button"
              onClick={() => mudarPeriodo(-1)}
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="agenda-today-button"
              onClick={voltarParaHoje}
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() => mudarPeriodo(1)}
              aria-label="Próximo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((dia) => (
            <span key={dia}>{dia}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {diasVisiveis.map((dia) => {
            const pertenceAoMes =
              dia.getMonth() === mesCalendario.getMonth() &&
              dia.getFullYear() === mesCalendario.getFullYear();

            const selecionadoDia = mesmaData(dia, dataSelecionada);

            const possuiAgendamento = agendamentos.some(
              (agendamento) =>
                agendamento.data === formatarDataBanco(dia)
            );

            return (
              <button
                key={dia.toISOString()}
                type="button"
                className={[
                  "calendar-day",
                  calendarioAberto && !pertenceAoMes ? "outside-month" : "",
                  selecionadoDia ? "selected-day" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selecionarDiaCalendario(dia)}
              >
                <span>{dia.getDate()}</span>
                {possuiAgendamento && (
                  <i aria-label="Possui agendamento" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="calendar-toggle"
          onClick={() => setCalendarioAberto((aberto) => !aberto)}
        >
          {calendarioAberto ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
          {calendarioAberto ? "Recolher mês" : "Ver mês inteiro"}
        </button>
      </section>

      {!carregando && (
        <p className="agenda-resumo">
          {atendimentosAtivos === 0
            ? "Nenhum atendimento neste dia"
            : `${atendimentosAtivos} atendimento${
                atendimentosAtivos > 1 ? "s" : ""
              }${
                atendimentosConcluidos > 0
                  ? ` • ${atendimentosConcluidos} concluído${
                      atendimentosConcluidos > 1 ? "s" : ""
                    }`
                  : ""
              }`}
        </p>
      )}

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
            const horarioAlmoco = estaNoIntervaloAlmoco(horarioHora);

            const agendamento = agendamentosDoDia.find(
              (item) => item.horario.slice(0, 5) === horarioHora
            );

            if (agendamento) {
              const cliente = obterCliente(agendamento.cliente_id);
              const servico = obterServico(agendamento.servico_id);

              return (
                <button
                  type="button"
                  key={agendamento.id}
                  className={`appointment ${agendamento.status}`}
                  onClick={() => setSelecionado(agendamento)}
                >
                  <span className="slot-time">{horarioHora}</span>
                  <div>
                    <strong>{cliente?.nome ?? "Cliente"}</strong>
                    <small>
                      {servico?.nome ?? "Serviço"} • {servico?.duracao ?? 0} min
                    </small>
                  </div>
                  <em>{nomeStatus(agendamento.status)}</em>
                </button>
              );
            }

            const inicioSlot = Number(horarioHora.slice(0, 2)) * 60 + Number(horarioHora.slice(3, 5));
            const atendimentoEmAndamento = agendamentosDoDia.find((item) => {
              const inicio = Number(item.horario.slice(0, 2)) * 60 + Number(item.horario.slice(3, 5));
              const servico = obterServico(item.servico_id);
              const fim = inicio + Math.max(Number(servico?.duracao) || 60, 1);
              return inicioSlot > inicio && inicioSlot < fim;
            });

            if (atendimentoEmAndamento) {
              const servico = obterServico(atendimentoEmAndamento.servico_id);
              return (
                <div className="available occupied-slot" key={horarioHora}>
                  <span>{horarioHora}</span>
                  <b>Ocupado • {servico?.nome ?? "Atendimento"}</b>
                </div>
              );
            }

            if (horarioAlmoco) {
              return (
                <div
                  className="available agenda-lunch"
                  key={horarioHora}
                  aria-label="Horário de almoço"
                >
                  <span>{horarioHora}</span>
                  <b>🍽️ Horário de almoço</b>
                </div>
              );
            }

            return (
              <button
                type="button"
                className="available available-button"
                key={horarioHora}
                onClick={() => abrirAgendamento(horarioHora)}
              >
                <span>{horarioHora}</span>
                <b>Disponível</b>
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
                    {horarios
                      .filter((hora) => !estaNoIntervaloAlmoco(hora))
                      .map(
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
