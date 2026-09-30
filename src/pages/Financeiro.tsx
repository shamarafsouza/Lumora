import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Wallet,
  X,
  Package,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

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
  status: string;
};

type LancamentoFinanceiro = {
  id: string;
  agendamento_id: string | null;
  valor_recebido: number;
  forma_pagamento: string;
  custo_material: number;
  observacoes: string | null;
  created_at: string;
};

type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  data: string;
  observacoes: string | null;
};

type TipoLancamento = "receita" | "despesa";

type Produto = {
  id: string;
  nome: string;
  quantidade_embalagem: number;
  unidade: string;
  preco_compra: number;
};

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

type Filtro = "todos" | "entradas" | "saidas";

type Movimentacao = {
  id: string;
  tipo: "entrada" | "saida";
  titulo: string;
  subtitulo: string;
  detalhe: string;
  valor: number;
  data: string;
};

function dataLocal(iso: string) {
  const d = new Date(iso);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const Financeiro = ({
  onNavigate,
}: {
  onNavigate: (page: "perfil") => void;
}) => {
  const [lancamentos, setLancamentos] = useState<
    LancamentoFinanceiro[]
  >([]);

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosAberto, setProdutosAberto] = useState(false);
  const [produtoNome, setProdutoNome] = useState("");
  const [produtoQuantidade, setProdutoQuantidade] = useState("");
  const [produtoUnidade, setProdutoUnidade] = useState("g");
  const [produtoPreco, setProdutoPreco] = useState("");
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(
    []
  );

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [modalAberto, setModalAberto] = useState(false);

  const [tipoLancamento, setTipoLancamento] =
    useState<TipoLancamento>("receita");

  const [agendamentoId, setAgendamentoId] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [observacoes, setObservacoes] = useState("");

  const [descricaoDespesa, setDescricaoDespesa] = useState("");
  const [categoriaDespesa, setCategoriaDespesa] =
    useState("Outros");
  const [tipoDespesa, setTipoDespesa] = useState("avulsa");
  const [valorDespesa, setValorDespesa] = useState("");
  const [dataDespesa, setDataDespesa] = useState(
    new Date().toISOString().slice(0, 10)
  );

  async function carregarFinanceiro() {
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

    const [
      financeiroResponse,
      despesasResponse,
      clientesResponse,
      servicosResponse,
      agendamentosResponse,
      produtosResponse,
    ] = await Promise.all([
      supabase
        .from("financeiro_atendimentos")
        .select(
          "id, agendamento_id, valor_recebido, forma_pagamento, custo_material, observacoes, created_at"
        )
        .eq("profissional_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("despesas")
        .select(
          "id, descricao, categoria, tipo, valor, data, observacoes"
        )
        .eq("profissional_id", user.id)
        .order("data", { ascending: false }),

      supabase
        .from("clientes")
        .select("id, nome")
        .eq("profissional_id", user.id)
        .order("nome"),

      supabase
        .from("servicos")
        .select("id, nome, preco")
        .eq("profissional_id", user.id)
        .order("nome"),

      supabase
        .from("agendamentos")
        .select(
          "id, cliente_id, servico_id, data, horario, status"
        )
        .eq("profissional_id", user.id)
        .order("data", { ascending: false })
        .order("horario", { ascending: false }),

      supabase
        .from("produtos")
        .select("id, nome, quantidade_embalagem, unidade, preco_compra")
        .eq("profissional_id", user.id)
        .order("nome"),
    ]);

    if (financeiroResponse.error) {
      console.error(financeiroResponse.error);
      setErro("Não foi possível carregar o financeiro.");
    }

    if (despesasResponse.error) {
      console.error(despesasResponse.error);
    }

    setLancamentos(
      (financeiroResponse.data || []).map((item) => ({
        ...item,
        valor_recebido: Number(item.valor_recebido),
        custo_material: Number(item.custo_material),
      }))
    );

    setDespesas(
      (despesasResponse.data || []).map((item) => ({
        ...item,
        valor: Number(item.valor),
      }))
    );

    setClientes(clientesResponse.data || []);

    setServicos(
      (servicosResponse.data || []).map((item) => ({
        ...item,
        preco: Number(item.preco),
      }))
    );

    setAgendamentos(agendamentosResponse.data || []);

    setProdutos(
      (produtosResponse.data || []).map((item) => ({
        ...item,
        quantidade_embalagem: Number(item.quantidade_embalagem),
        preco_compra: Number(item.preco_compra),
      }))
    );

    setCarregando(false);
  }

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  const totais = useMemo(() => {
    const receitas = lancamentos.reduce(
      (total, item) => total + item.valor_recebido,
      0
    );

    const materiais = lancamentos.reduce(
      (total, item) => total + item.custo_material,
      0
    );

    const despesasGerais = despesas.reduce(
      (total, item) => total + item.valor,
      0
    );

    const custos = materiais + despesasGerais;

    return {
      receitas,
      custos,
      resultado: receitas - custos,
    };
  }, [lancamentos, despesas]);

  const movimentacoes = useMemo<Movimentacao[]>(() => {
    const entradas: Movimentacao[] = lancamentos.map((item) => {
      const ag = agendamentos.find((a) => a.id === item.agendamento_id);
      const cliente = ag ? clientes.find((c) => c.id === ag.cliente_id) : null;
      const servico = ag ? servicos.find((s) => s.id === ag.servico_id) : null;

      return {
        id: `e-${item.id}`,
        tipo: "entrada",
        titulo: cliente?.nome ?? "Entrada avulsa",
        subtitulo: servico?.nome ?? "Lançamento financeiro",
        detalhe:
          item.forma_pagamento +
          (item.custo_material > 0
            ? ` · Material ${formatarMoeda(item.custo_material)}`
            : ""),
        valor: item.valor_recebido,
        data: ag?.data ?? dataLocal(item.created_at),
      };
    });

    const saidas: Movimentacao[] = despesas.map((d) => ({
      id: `s-${d.id}`,
      tipo: "saida",
      titulo: d.descricao,
      subtitulo: `${d.categoria} · ${d.tipo}`,
      detalhe: "",
      valor: d.valor,
      data: d.data,
    }));

    return [...entradas, ...saidas].sort((a, b) =>
      b.data.localeCompare(a.data)
    );
  }, [lancamentos, despesas, agendamentos, clientes, servicos]);

  const movimentacoesVisiveis = movimentacoes.filter(
    (m) =>
      filtro === "todos" ||
      (filtro === "entradas" ? m.tipo === "entrada" : m.tipo === "saida")
  );


  function obterCliente(id: string) {
    return clientes.find((cliente) => cliente.id === id);
  }

  function obterServico(id: string) {
    return servicos.find((servico) => servico.id === id);
  }

  function abrirModal(tipo: TipoLancamento) {
    setTipoLancamento(tipo);
    setErro("");

    setAgendamentoId("");
    setValorRecebido("");
    setFormaPagamento("pix");
    setObservacoes("");

    setDescricaoDespesa("");
    setCategoriaDespesa("Outros");
    setTipoDespesa("avulsa");
    setValorDespesa("");
    setDataDespesa(
      new Date().toISOString().slice(0, 10)
    );

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
  }

  function abrirProdutos() {
    setErro("");
    setProdutoNome("");
    setProdutoQuantidade("");
    setProdutoUnidade("g");
    setProdutoPreco("");
    setProdutosAberto(true);
  }

  function fecharProdutos() {
    if (salvandoProduto) return;
    setProdutosAberto(false);
  }

  async function cadastrarProduto(event: React.FormEvent) {
    event.preventDefault();
    setErro("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const quantidade = Number(produtoQuantidade.replace(",", "."));
    const preco = Number(produtoPreco.replace(",", "."));

    if (!produtoNome.trim()) {
      setErro("Informe o nome do produto.");
      return;
    }
    if (!quantidade || quantidade <= 0) {
      setErro("Informe a quantidade da embalagem.");
      return;
    }
    if (!preco || preco <= 0) {
      setErro("Informe o preço pago pelo produto.");
      return;
    }

    setSalvandoProduto(true);

    const { data, error } = await supabase
      .from("produtos")
      .insert({
        profissional_id: user.id,
        nome: produtoNome.trim(),
        quantidade_embalagem: quantidade,
        unidade: produtoUnidade,
        preco_compra: preco,
      })
      .select("id, nome, quantidade_embalagem, unidade, preco_compra")
      .single();

    if (error) {
      console.error(error);
      setErro(error.message || "Não foi possível cadastrar o produto.");
      setSalvandoProduto(false);
      return;
    }

    setProdutos((atual) =>
      [...atual, { ...data, quantidade_embalagem: Number(data.quantidade_embalagem), preco_compra: Number(data.preco_compra) }]
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
    setSalvandoProduto(false);
    setProdutoNome("");
    setProdutoQuantidade("");
    setProdutoPreco("");
  }

  async function excluirProduto(produto: Produto) {
    if (!window.confirm(`Excluir o produto "${produto.nome}"?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", produto.id)
      .eq("profissional_id", user.id);

    if (error) {
      console.error(error);
      setErro(error.message || "Não foi possível excluir o produto.");
      return;
    }

    setProdutos((atual) => atual.filter((item) => item.id !== produto.id));
  }

  function custoUnitario(produto: Produto) {
    return produto.preco_compra / produto.quantidade_embalagem;
  }

  async function salvarLancamento(
    event: React.FormEvent
  ) {
    event.preventDefault();
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      return;
    }

    setSalvando(true);

    if (tipoLancamento === "receita") {
      const valor = Number(
        valorRecebido.replace(",", ".")
      );

      if (!valor || valor <= 0) {
        setErro("Informe um valor recebido.");
        setSalvando(false);
        return;
      }

      const { error } = await supabase
        .from("financeiro_atendimentos")
        .insert({
          profissional_id: user.id,
          agendamento_id: agendamentoId || null,
          valor_recebido: valor,
          forma_pagamento: formaPagamento,
          custo_material: 0,
          observacoes:
            observacoes.trim() || null,
        });

      if (error) {
        console.error(error);

        if (
          error.code === "23505"
        ) {
          setErro(
            "Esse agendamento já possui um lançamento financeiro."
          );
        } else {
          setErro(
            error.message ||
              "Não foi possível registrar a receita."
          );
        }

        setSalvando(false);
        return;
      }
    } else {
      const valor = Number(
        valorDespesa.replace(",", ".")
      );

      if (!descricaoDespesa.trim()) {
        setErro("Informe a descrição da despesa.");
        setSalvando(false);
        return;
      }

      if (!valor || valor <= 0) {
        setErro("Informe o valor da despesa.");
        setSalvando(false);
        return;
      }

      const { error } = await supabase
        .from("despesas")
        .insert({
          profissional_id: user.id,
          descricao: descricaoDespesa.trim(),
          categoria: categoriaDespesa,
          tipo: tipoDespesa,
          valor,
          data: dataDespesa,
          observacoes:
            observacoes.trim() || null,
        });

      if (error) {
        console.error(error);

        setErro(
          error.message ||
            "Não foi possível registrar a despesa."
        );

        setSalvando(false);
        return;
      }
    }

    setSalvando(false);
    setModalAberto(false);

    await carregarFinanceiro();
  }

  return (
    <main className="page financeiro-page">
      <header className="financeiro-header">
        <div>
          <span className="financeiro-eyebrow">
            LUMORA
          </span>

          <h1>Financeiro</h1>

          <p>Fluxo de caixa do seu negócio.</p>
        </div>

        <button
          type="button"
          className="avatar page-avatar-button"
          onClick={() => onNavigate("perfil")}
          aria-label="Abrir perfil"
          title="Perfil"
        >
          LU
        </button>
      </header>

      <section className="financeiro-resumo">
        <div className="financeiro-card receita">
          <div className="financeiro-card-icon">
            <ArrowUp size={17} />
          </div>

          <span>Receitas</span>

          <strong>
            {formatarMoeda(totais.receitas)}
          </strong>
        </div>

        <div className="financeiro-card custo">
          <div className="financeiro-card-icon">
            <ArrowDown size={17} />
          </div>

          <span>Custos</span>

          <strong>
            {formatarMoeda(totais.custos)}
          </strong>
        </div>

        <div className="financeiro-card resultado">
          <div className="financeiro-card-icon">
            <Wallet size={17} />
          </div>

          <span>Resultado</span>

          <strong>
            {formatarMoeda(totais.resultado)}
          </strong>
        </div>
      </section>

      <div className="financeiro-botoes">
        <button type="button" onClick={() => abrirModal("receita")}>
          <ArrowUp size={17} />
          Nova entrada
        </button>

        <button type="button" onClick={() => abrirModal("despesa")}>
          <ArrowDown size={17} />
          Nova saída
        </button>

        <button type="button" onClick={abrirProdutos}>
          <Package size={17} />
          Produtos e custos
        </button>
      </div>

      {produtosAberto && (
        <div className="financeiro-produtos-panel">
          <div className="financeiro-section-header">
            <div>
              <span className="financeiro-eyebrow">CUSTOS</span>
              <h2>Produtos utilizados</h2>
              <p>Cadastre seus produtos uma vez. O Lumora calcula automaticamente o custo por g, ml ou unidade.</p>
            </div>
            <button type="button" className="financeiro-modal-close" onClick={fecharProdutos}>
              <X size={19} />
            </button>
          </div>

          <form className="financeiro-form produto-form" onSubmit={cadastrarProduto}>
            <label>Nome do produto<input value={produtoNome} onChange={(e) => setProdutoNome(e.target.value)} placeholder="Ex.: Gel construtor" /></label>
            <div className="produto-grid">
              <label>Quantidade da embalagem<input type="text" inputMode="decimal" value={produtoQuantidade} onChange={(e) => setProdutoQuantidade(e.target.value)} placeholder="30" /></label>
              <label>Unidade<select value={produtoUnidade} onChange={(e) => setProdutoUnidade(e.target.value)}><option value="g">g</option><option value="ml">ml</option><option value="un">unidade</option></select></label>
            </div>
            <label>Preço pago<input type="text" inputMode="decimal" value={produtoPreco} onChange={(e) => setProdutoPreco(e.target.value)} placeholder="80,00" /></label>
            {produtoQuantidade && produtoPreco && Number(produtoQuantidade.replace(",", ".")) > 0 && (
              <div className="produto-custo-preview">
                Custo: <strong>{formatarMoeda(Number(produtoPreco.replace(",", ".")) / Number(produtoQuantidade.replace(",", ".")))}</strong> / {produtoUnidade}
              </div>
            )}
            {erro && produtosAberto && <div className="agenda-error">{erro}</div>}
            <button type="submit" className="financeiro-save" disabled={salvandoProduto}>{salvandoProduto ? "Cadastrando..." : "Cadastrar produto"}</button>
          </form>

          <div className="produtos-lista">
            {produtos.length === 0 ? (
              <div className="financeiro-vazio"><Package size={30} /><strong>Nenhum produto cadastrado</strong><span>Cadastre gel, primer, top coat, lixas e outros materiais usados nos serviços.</span></div>
            ) : produtos.map((produto) => (
              <article className="produto-item" key={produto.id}>
                <div><strong>{produto.nome}</strong><span>{produto.quantidade_embalagem} {produto.unidade} · {formatarMoeda(produto.preco_compra)}</span><small>{formatarMoeda(custoUnitario(produto))} / {produto.unidade}</small></div>
                <button type="button" onClick={() => excluirProduto(produto)} aria-label={`Excluir ${produto.nome}`}><Trash2 size={17} /></button>
              </article>
            ))}
          </div>
        </div>
      )}

      {erro && !modalAberto && (
        <div className="agenda-error">{erro}</div>
      )}

      <section className="financeiro-detalhes">
        <div className="financeiro-section-header">
          <div>
            <h2>Movimentações</h2>
            <p>Tudo que entrou e saiu do seu negócio.</p>
          </div>
        </div>

        <div className="financeiro-abas">
          {(["todos", "entradas", "saidas"] as Filtro[]).map((aba) => (
            <button
              key={aba}
              type="button"
              className={filtro === aba ? "ativa" : ""}
              onClick={() => setFiltro(aba)}
            >
              {aba === "todos" ? "Tudo" : aba === "entradas" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="financeiro-vazio">Carregando financeiro...</div>
        ) : movimentacoesVisiveis.length === 0 ? (
          <div className="financeiro-vazio">
            <Wallet size={30} />
            <strong>Nada por aqui ainda</strong>
            <span>
              Use "Nova entrada" ou "Nova saída" para registrar o que
              entrou e o que você gastou.
            </span>
          </div>
        ) : (
          <div className="financeiro-lista">
            {movimentacoesVisiveis.map((m) => (
              <article className="financeiro-lancamento" key={m.id}>
                <div className={`mov-icone ${m.tipo}`}>
                  {m.tipo === "entrada" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                </div>

                <div className="mov-info">
                  <strong>{m.titulo}</strong>
                  <span>{m.subtitulo}</span>
                  <small>
                    {new Date(`${m.data}T00:00:00`).toLocaleDateString("pt-BR")}
                    {m.detalhe ? ` · ${m.detalhe}` : ""}
                  </small>
                </div>

                <div className={`financeiro-valores ${m.tipo === "saida" ? "despesa-valor" : ""}`}>
                  <strong>
                    {m.tipo === "entrada" ? "+ " : "− "}
                    {formatarMoeda(m.valor)}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="financeiro-modal-backdrop"
          onClick={fecharModal}
        >
          <div
            className="financeiro-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="financeiro-modal-close"
              onClick={fecharModal}
              disabled={salvando}
            >
              <X size={19} />
            </button>

            <div className="financeiro-modal-handle" />

            <h2>
              {tipoLancamento === "receita"
                ? "Nova entrada"
                : "Nova saída"}
            </h2>

            <p>
              {tipoLancamento === "receita"
                ? "Registre um valor que entrou."
                : "Registre um gasto do seu negócio."}
            </p>

            <form
              className="financeiro-form"
              onSubmit={salvarLancamento}
            >
              {tipoLancamento === "receita" ? (
                <>
                  <label>
                    Atendimento
                    <select
                      value={agendamentoId}
                      onChange={(event) =>
                        setAgendamentoId(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Receita avulsa
                      </option>

                      {agendamentos
                        .filter(
                          (agendamento) =>
                            agendamento.status !==
                            "cancelado"
                        )
                        .map((agendamento) => {
                          const cliente =
                            obterCliente(
                              agendamento.cliente_id
                            );

                          const servico =
                            obterServico(
                              agendamento.servico_id
                            );

                          return (
                            <option
                              key={agendamento.id}
                              value={agendamento.id}
                            >
                              {cliente?.nome ??
                                "Cliente"}{" "}
                              —{" "}
                              {servico?.nome ??
                                "Serviço"}{" "}
                              —{" "}
                              {new Date(
                                `${agendamento.data}T00:00:00`
                              ).toLocaleDateString(
                                "pt-BR"
                              )}
                            </option>
                          );
                        })}
                    </select>
                  </label>

                  <label>
                    Valor recebido
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
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
                        PIX
                      </option>
                      <option value="dinheiro">
                        Dinheiro
                      </option>
                      <option value="debito">
                        Cartão de débito
                      </option>
                      <option value="credito">
                        Cartão de crédito
                      </option>
                      <option value="transferencia">
                        Transferência
                      </option>
                    </select>
                  </label>

                  <div className="financeiro-material-auto">
                    <strong>Material calculado automaticamente</strong>
                    <span>
                      Para atendimentos concluídos pela Agenda, o custo dos
                      produtos vinculados ao serviço será registrado
                      automaticamente.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Descrição
                    <input
                      type="text"
                      placeholder="Ex.: Compra de materiais"
                      value={descricaoDespesa}
                      onChange={(event) =>
                        setDescricaoDespesa(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Categoria
                    <select
                      value={categoriaDespesa}
                      onChange={(event) =>
                        setCategoriaDespesa(
                          event.target.value
                        )
                      }
                    >
                      <option value="Materiais">
                        Materiais
                      </option>
                      <option value="Aluguel">
                        Aluguel
                      </option>
                      <option value="Energia">
                        Energia
                      </option>
                      <option value="Internet">
                        Internet
                      </option>
                      <option value="Produtos">
                        Produtos
                      </option>
                      <option value="Marketing">
                        Marketing
                      </option>
                      <option value="Outros">
                        Outros
                      </option>
                    </select>
                  </label>

                  <label>
                    Tipo
                    <select
                      value={tipoDespesa}
                      onChange={(event) =>
                        setTipoDespesa(
                          event.target.value
                        )
                      }
                    >
                      <option value="fixa">
                        Fixa
                      </option>
                      <option value="avulsa">
                        Avulsa
                      </option>
                    </select>
                  </label>

                  <label>
                    Valor
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={valorDespesa}
                      onChange={(event) =>
                        setValorDespesa(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Data
                    <input
                      type="date"
                      value={dataDespesa}
                      onChange={(event) =>
                        setDataDespesa(
                          event.target.value
                        )
                      }
                    />
                  </label>
                </>
              )}

              <label>
                Observações
                <textarea
                  placeholder="Opcional"
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(
                      event.target.value
                    )
                  }
                  rows={3}
                />
              </label>

              {erro && (
                <div className="agenda-error">
                  {erro}
                </div>
              )}

              <div className="financeiro-modal-actions">
                <button
                  type="button"
                  className="financeiro-cancel"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="financeiro-save"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Financeiro;