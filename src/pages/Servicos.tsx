import { useEffect, useState } from "react";
import {
  Clock3,
  Plus,
  X,
  LoaderCircle,
  Pencil,
  Trash2,
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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [duracao, setDuracao] = useState("");
  const [preco, setPreco] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(
    null
  );

  async function carregarServicos() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro(
        "Não foi possível identificar sua conta."
      );
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("servicos")
      .select(
        "id, profissional_id, nome, categoria, duracao, preco, created_at"
      )
      .eq("profissional_id", user.id)
      .order("categoria", {
        ascending: true,
      })
      .order("nome", {
        ascending: true,
      });

    if (error) {
      console.error(
        "ERRO AO CARREGAR SERVIÇOS:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar seus serviços."
      );

      setCarregando(false);
      return;
    }

    setServicos(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  function limparFormulario() {
    setNome("");
    setCategoria("");
    setDuracao("");
    setPreco("");
    setEditando(null);
    setErro("");
  }

  function abrirAdicionar() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditar(servico: Servico) {
    setEditando(servico);

    setNome(servico.nome);
    setCategoria(servico.categoria);
    setDuracao(String(servico.duracao));

    setPreco(
      Number(servico.preco)
        .toFixed(2)
        .replace(".", ",")
    );

    setErro("");
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

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  function formatarPrecoInput(valor: string) {
    const somenteNumeros = valor.replace(
      /\D/g,
      ""
    );

    if (!somenteNumeros) {
      return "";
    }

    const numero =
      Number(somenteNumeros) / 100;

    return numero
      .toFixed(2)
      .replace(".", ",");
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
      setErro(
        "Informe uma duração válida em minutos."
      );
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
      setErro(
        "Sua sessão expirou. Faça login novamente."
      );
      setSalvando(false);
      return;
    }

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
        console.error(
          "ERRO AO EDITAR SERVIÇO:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível atualizar o serviço."
        );

        setSalvando(false);
        return;
      }

      setServicos((atual) =>
        atual
          .map((servico) =>
            servico.id === data.id
              ? data
              : servico
          )
          .sort((a, b) => {
            const categoriaCompare =
              a.categoria.localeCompare(
                b.categoria
              );

            if (categoriaCompare !== 0) {
              return categoriaCompare;
            }

            return a.nome.localeCompare(
              b.nome
            );
          })
      );

      setSalvando(false);
      setModalAberto(false);
      limparFormulario();

      return;
    }

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
      console.error(
        "ERRO AO CADASTRAR SERVIÇO:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível cadastrar o serviço."
      );

      setSalvando(false);
      return;
    }

    setServicos((atual) =>
      [...atual, data].sort((a, b) => {
        const categoriaCompare =
          a.categoria.localeCompare(
            b.categoria
          );

        if (categoriaCompare !== 0) {
          return categoriaCompare;
        }

        return a.nome.localeCompare(
          b.nome
        );
      })
    );

    setSalvando(false);
    setModalAberto(false);
    limparFormulario();
  }

  async function excluirServico(
    servico: Servico
  ) {
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
      setErro(
        "Sua sessão expirou. Faça login novamente."
      );
      setExcluindo(null);
      return;
    }

    const { error } = await supabase
      .from("servicos")
      .delete()
      .eq("id", servico.id)
      .eq("profissional_id", user.id);

    if (error) {
      console.error(
        "ERRO AO EXCLUIR SERVIÇO:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível excluir o serviço."
      );

      setExcluindo(null);
      return;
    }

    setServicos((atual) =>
      atual.filter(
        (item) => item.id !== servico.id
      )
    );

    setExcluindo(null);
  }

  const grupos = servicos.reduce<
    Record<string, Servico[]>
  >((acc, servico) => {
    const chave =
      servico.categoria?.trim() ||
      "Outros";

    if (!acc[chave]) {
      acc[chave] = [];
    }

    acc[chave].push(servico);

    return acc;
  }, {});

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
          {servicos.length === 1
            ? "serviço"
            : "serviços"}
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

          <span>
            Carregando serviços...
          </span>
        </div>
      ) : servicos.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <Plus size={22} />
          </div>

          <h3>
            Nenhum serviço cadastrado
          </h3>

          <p>
            Cadastre seus serviços para
            começar a organizar seus
            atendimentos.
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
                        <strong>
                          {servico.nome}
                        </strong>

                        <span>
                          <Clock3 size={16} />

                          {servico.duracao} min
                        </span>
                      </div>

                      <b>
                        {Number(
                          servico.preco
                        ).toLocaleString(
                          "pt-BR",
                          {
                            style:
                              "currency",
                            currency:
                              "BRL",
                          }
                        )}
                      </b>
                    </div>

                    <div className="service-actions">
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditar(
                            servico
                          )
                        }
                        aria-label={`Editar ${servico.nome}`}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          excluirServico(
                            servico
                          )
                        }
                        disabled={
                          excluindo ===
                          servico.id
                        }
                        aria-label={`Excluir ${servico.nome}`}
                      >
                        {excluindo ===
                        servico.id ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Trash2
                            size={16}
                          />
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

            <form
              onSubmit={salvarServico}
            >
              <label>
                Nome

                <input
                  type="text"
                  placeholder="Ex.: Alongamento em gel"
                  value={nome}
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
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
                    setCategoria(
                      event.target.value
                    )
                  }
                />

                <datalist id="categorias-servicos">
                  {categoriasPadrao.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      />
                    )
                  )}
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
                      setDuracao(
                        event.target.value
                      )
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

              {erro && (
                <div className="client-error">
                  {erro}
                </div>
              )}

              <div className="client-modal-actions">
                <button
                  type="button"
                  className="client-cancel"
                  onClick={
                    fecharModal
                  }
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