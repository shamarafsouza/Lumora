import { useEffect, useState } from "react";
import {
  Clock3,
  Plus,
  X,
  LoaderCircle,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Servico = {
  id: string;
  profissional_id: string;
  nome: string;
  categoria: string;
  duracao: number;
  preco: number;
  created_at: string;
};

type Produto = {
  id: string;
  nome: string;
  quantidade_embalagem: number;
  unidade: "g" | "ml" | "un";
  preco_compra: number;
};

const categoriasPadrao = [
  "Manicure",
  "Pedicure",
  "Alongamento",
  "Esmaltação",
  "Nail Art",
  "Manutenção",
  "Outros",
];

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [duracao, setDuracao] = useState("");
  const [preco, setPreco] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Não foi possível identificar sua conta.");
      setCarregando(false);
      return;
    }

    const [servicosResponse, produtosResponse] = await Promise.all([
      supabase
        .from("servicos")
        .select(
          "id, profissional_id, nome, categoria, duracao, preco, created_at"
        )
        .eq("profissional_id", user.id)
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true }),

      supabase
        .from("produtos")
        .select(
          "id, nome, quantidade_embalagem, unidade, preco_compra"
        )
        .eq("profissional_id", user.id)
        .order("nome", { ascending: true }),
    ]);

    if (servicosResponse.error) {
      console.error("ERRO AO CARREGAR SERVIÇOS:", servicosResponse.error);
      setErro(
        servicosResponse.error.message ||
          "Não foi possível carregar seus serviços."
      );
      setCarregando(false);
      return;
    }

    if (produtosResponse.error) {
      console.error("ERRO AO CARREGAR PRODUTOS:", produtosResponse.error);
      setErro(
        produtosResponse.error.message ||
          "Não foi possível carregar seus produtos."
      );
      setCarregando(false);
      return;
    }

    setServicos(servicosResponse.data ?? []);

    setProdutos(
      (produtosResponse.data ?? []).map((produto) => ({
        ...produto,
        quantidade_embalagem: Number(produto.quantidade_embalagem),
        preco_compra: Number(produto.preco_compra),
      }))
    );

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function limparFormulario() {
    setNome("");
    setCategoria("");
    setDuracao("");
    setPreco("");
    setProdutosSelecionados([]);
    setEditando(null);
    setErro("");
  }

  async function abrirAdicionar() {
    limparFormulario();

    if (produtos.length === 0) {
      setErro("");
    }

    setModalAberto(true);
  }

  async function abrirEditar(servico: Servico) {
    setEditando(servico);
    setNome(servico.nome);
    setCategoria(servico.categoria);
    setDuracao(String(servico.duracao));
    setPreco(
      Number(servico.preco).toFixed(2).replace(".", ",")
    );
    setErro("");

    const { data, error } = await supabase
      .from("servico_produtos")
      .select("produto_id")
      .eq("servico_id", servico.id);

    if (error) {
      console.error("ERRO AO CARREGAR PRODUTOS DO SERVIÇO:", error);
      setErro(
        error.message ||
          "Não foi possível carregar os produtos deste serviço."
      );
      setProdutosSelecionados([]);
    } else {
      setProdutosSelecionados(
        (data ?? []).map((item) => item.produto_id)
      );
    }

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    limparFormulario();
  }

  function converterPreco(valor: string) {
    const limpo = valor
      .replace(/[^\d,]/g, "")
      .replace(",", ".");

    const numero = Number(limpo);

    return Number.isFinite(numero) ? numero : 0;
  }

  function formatarPrecoInput(valor: string) {
    const somenteNumeros = valor.replace(/\D/g, "");

    if (!somenteNumeros) {
      return "";
    }

    const numero = Number(somenteNumeros) / 100;

    return numero.toFixed(2).replace(".", ",");
  }

  function alternarProduto(produtoId: string) {
    setProdutosSelecionados((atual) =>
      atual.includes(produtoId)
        ? atual.filter((id) => id !== produtoId)
        : [...atual, produtoId]
    );
  }

  async function salvarProdutosDoServico(
    servicoId: string,
    profissionalId: string
  ) {
    const { error: deleteError } = await supabase
      .from("servico_produtos")
      .delete()
      .eq("servico_id", servicoId)
      .eq("profissional_id", profissionalId);

    if (deleteError) {
      throw deleteError;
    }

    if (produtosSelecionados.length === 0) {
      return;
    }

    const registros = produtosSelecionados.map((produtoId) => ({
      profissional_id: profissionalId,
      servico_id: servicoId,
      produto_id: produtoId,
    }));

    const { error: insertError } = await supabase
      .from("servico_produtos")
      .insert(registros);

    if (insertError) {
      throw insertError;
    }
  }

  async function salvarServico(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    const nomeLimpo = nome.trim();
    const categoriaLimpa = categoria.trim();
    const duracaoNumero = Number(duracao);
    const precoNumero = converterPreco(preco);

    if (!nomeLimpo) {
      setErro("Digite o nome do serviço.");
      return;
    }

    if (!categoriaLimpa) {
      setErro("Informe a categoria do serviço.");
      return;
    }

    if (
      !duracao ||
      !Number.isFinite(duracaoNumero) ||
      duracaoNumero <= 0
    ) {
      setErro("Informe uma duração válida em minutos.");
      return;
    }

    if (
      !Number.isFinite(precoNumero) ||
      precoNumero < 0
    ) {
      setErro("Informe um preço válido.");
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

    try {
      if (editando) {
        const { data, error } = await supabase
          .from("servicos")
          .update({
            nome: nomeLimpo,
            categoria: categoriaLimpa,
            duracao: duracaoNumero,
            preco: precoNumero,
          })
          .eq("id", editando.id)
          .eq("profissional_id", user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        await salvarProdutosDoServico(data.id, user.id);

        setServicos((atual) =>
          atual
            .map((servico) =>
              servico.id === data.id ? data : servico
            )
            .sort((a, b) => {
              const categoriaCompare =
                a.categoria.localeCompare(b.categoria);

              if (categoriaCompare !== 0) {
                return categoriaCompare;
              }

              return a.nome.localeCompare(b.nome);
            })
        );
      } else {
        const { data, error } = await supabase
          .from("servicos")
          .insert({
            profissional_id: user.id,
            nome: nomeLimpo,
            categoria: categoriaLimpa,
            duracao: duracaoNumero,
            preco: precoNumero,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        await salvarProdutosDoServico(data.id, user.id);

        setServicos((atual) =>
          [...atual, data].sort((a, b) => {
            const categoriaCompare =
              a.categoria.localeCompare(b.categoria);

            if (categoriaCompare !== 0) {
              return categoriaCompare;
            }

            return a.nome.localeCompare(b.nome);
          })
        );
      }

      setSalvando(false);
      setModalAberto(false);
      limparFormulario();
    } catch (error: any) {
      console.error("ERRO AO SALVAR SERVIÇO:", error);

      setErro(
        error?.message ||
          "Não foi possível salvar o serviço."
      );

      setSalvando(false);
    }
  }

  async function excluirServico(servico: Servico) {
    const confirmou = window.confirm(
      `Deseja realmente excluir o serviço "${servico.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    setErro("");
    setExcluindo(servico.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setExcluindo(null);
      return;
    }

    const { error } = await supabase
      .from("servicos")
      .delete()
      .eq("id", servico.id)
      .eq("profissional_id", user.id);

    if (error) {
      console.error("ERRO AO EXCLUIR SERVIÇO:", error);

      setErro(
        error.message ||
          "Não foi possível excluir o serviço."
      );

      setExcluindo(null);
      return;
    }

    setServicos((atual) =>
      atual.filter((item) => item.id !== servico.id)
    );

    setExcluindo(null);
  }

  const grupos = servicos.reduce<Record<string, Servico[]>>(
    (acc, servico) => {
      const chave =
        servico.categoria?.trim() || "Outros";

      if (!acc[chave]) {
        acc[chave] = [];
      }

      acc[chave].push(servico);

      return acc;
    },
    {}
  );

  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Lumora</h1>
          <p>Catálogo de Serviços</p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="services-title">
        <h2>Meus Serviços</h2>

        <b>
          {servicos.length}{" "}
          {servicos.length === 1 ? "serviço" : "serviços"}
        </b>
      </div>

      <button
        type="button"
        className="add-service-button"
        onClick={abrirAdicionar}
      >
        <Plus size={18} />
        Adicionar serviço
      </button>

      {erro && !modalAberto && (
        <div className="client-error">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="clients-loading">
          <LoaderCircle
            size={22}
            className="spin"
          />
          <span>Carregando serviços...</span>
        </div>
      ) : servicos.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <Plus size={22} />
          </div>

          <h3>Nenhum serviço cadastrado</h3>

          <p>
            Cadastre seus serviços para começar a
            organizar seus atendimentos.
          </p>

          <button
            type="button"
            onClick={abrirAdicionar}
          >
            Adicionar primeiro serviço
          </button>
        </div>
      ) : (
        <div className="services-list">
          {Object.entries(grupos).map(
            ([categoria, lista]) => (
              <section
                className="service-group"
                key={categoria}
              >
                <h2>{categoria}</h2>

                {lista.map((servico) => (
                  <article
                    className="service-card"
                    key={servico.id}
                  >
                    <div className="service-main">
                      <div>
                        <strong>{servico.nome}</strong>

                        <span>
                          <Clock3 size={16} />
                          {servico.duracao} min
                        </span>
                      </div>

                      <b>
                        {Number(
                          servico.preco
                        ).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </b>
                    </div>

                    <div className="service-actions">
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditar(servico)
                        }
                        aria-label={`Editar ${servico.nome}`}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          excluirServico(servico)
                        }
                        disabled={
                          excluindo === servico.id
                        }
                        aria-label={`Excluir ${servico.nome}`}
                      >
                        {excluindo === servico.id ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )
          )}
        </div>
      )}

      {modalAberto && (
        <div
          className="client-modal-backdrop"
          onClick={fecharModal}
        >
          <section
            className="client-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="client-modal-close"
              onClick={fecharModal}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>

            <div className="client-modal-handle" />

            <h2>
              {editando
                ? "Editar serviço"
                : "Adicionar serviço"}
            </h2>

            <p>
              {editando
                ? "Atualize os dados do serviço."
                : "Cadastre um novo serviço no seu catálogo."}
            </p>

            <form onSubmit={salvarServico}>
              <label>
                Nome

                <input
                  type="text"
                  placeholder="Ex.: Alongamento em gel"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  autoFocus
                />
              </label>

              <label>
                Categoria

                <input
                  type="text"
                  list="categorias-servicos"
                  placeholder="Ex.: Alongamento"
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value)
                  }
                />

                <datalist id="categorias-servicos">
                  {categoriasPadrao.map((item) => (
                    <option
                      key={item}
                      value={item}
                    />
                  ))}
                </datalist>
              </label>

              <label>
                Duração

                <div className="service-input-with-suffix">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex.: 60"
                    value={duracao}
                    onChange={(event) =>
                      setDuracao(event.target.value)
                    }
                  />
                  <span>min</span>
                </div>
              </label>

              <label>
                Preço

                <div className="service-input-with-prefix">
                  <span>R$</span>

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={preco}
                    onChange={(event) =>
                      setPreco(
                        formatarPrecoInput(
                          event.target.value
                        )
                      )
                    }
                  />
                </div>
              </label>

              <div className="service-products-section">
                <div className="service-products-title">
                  <div>
                    <strong>
                      Produtos gastos neste serviço
                    </strong>
                    <span>
                      Selecione os produtos que você
                      normalmente utiliza.
                    </span>
                  </div>

                  <Package size={20} />
                </div>

                {produtos.length === 0 ? (
                  <div className="service-products-empty">
                    <Package size={20} />
                    <span>
                      Você ainda não cadastrou produtos.
                      Cadastre-os em Financeiro →
                      Produtos e custos.
                    </span>
                  </div>
                ) : (
                  <div className="service-products-list">
                    {produtos.map((produto) => {
                      const selecionado =
                        produtosSelecionados.includes(
                          produto.id
                        );

                      return (
                        <label
                          key={produto.id}
                          className={`service-product-option ${
                            selecionado
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() =>
                              alternarProduto(
                                produto.id
                              )
                            }
                          />

                          <span className="service-product-check">
                            {selecionado ? "✓" : ""}
                          </span>

                          <span className="service-product-info">
                            <strong>
                              {produto.nome}
                            </strong>

                            <small>
                              {produto.quantidade_embalagem}{" "}
                              {produto.unidade} ·{" "}
                              {Number(
                                produto.preco_compra
                              ).toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                }
                              )}
                            </small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {erro && (
                <div className="client-error">
                  {erro}
                </div>
              )}

              <div className="client-modal-actions">
                <button
                  type="button"
                  className="client-cancel"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="client-save"
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
                  ) : editando ? (
                    "Salvar alterações"
                  ) : (
                    "Salvar serviço"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
