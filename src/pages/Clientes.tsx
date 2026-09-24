import { useEffect, useState } from "react";
import {
  MessageCircle,
  Plus,
  X,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  created_at: string;
};

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarClientes() {
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

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("profissional_id", user.id)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      setErro("Não foi possível carregar suas clientes.");
      setCarregando(false);
      return;
    }

    setClientes(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  function abrirModal() {
    setNome("");
    setTelefone("");
    setObservacoes("");
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setErro("");
  }

  async function adicionarCliente(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    if (!nome.trim()) {
      setErro("Digite o nome da cliente.");
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

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        profissional_id: user.id,
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        observacoes: observacoes.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setErro("Não foi possível cadastrar a cliente.");
      setSalvando(false);
      return;
    }

    setClientes((atual) =>
      [...atual, data].sort((a, b) =>
        a.nome.localeCompare(b.nome)
      )
    );

    setNome("");
    setTelefone("");
    setObservacoes("");
    setSalvando(false);
    setModalAberto(false);
  }

  function formatarTelefone(telefone: string | null) {
    if (!telefone) return "Telefone não informado";

    return telefone;
  }

  return (
    <main className="page clientes-page">
      <header className="top">
        <div>
          <h1>Lumora</h1>

          <p>Lista de Clientes Cadastradas</p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="clients-title">
        <h2>Minhas Clientes</h2>

        <b>
          {clientes.length}{" "}
          {clientes.length === 1 ? "Total" : "Total"}
        </b>
      </div>

      <button
        type="button"
        className="add-client-button"
        onClick={abrirModal}
      >
        <Plus size={17} />
        Adicionar cliente
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

          <span>Carregando clientes...</span>
        </div>
      ) : clientes.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <Plus size={22} />
          </div>

          <h3>Nenhuma cliente cadastrada</h3>

          <p>
            Cadastre sua primeira cliente para começar
            a organizar seus atendimentos.
          </p>

          <button
            type="button"
            onClick={abrirModal}
          >
            Adicionar primeira cliente
          </button>
        </div>
      ) : (
        <div className="clients">
          {clientes.map((cliente) => {
            const iniciais = cliente.nome
              .trim()
              .split(/\s+/)
              .map((parte) => parte[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <article
                className="client-card"
                key={cliente.id}
              >
                <div className="initials">
                  {iniciais}
                </div>

                <div className="client-info">
                  <strong>{cliente.nome}</strong>

                  <span>
                    {formatarTelefone(
                      cliente.telefone
                    )}
                  </span>
                </div>

                {cliente.telefone && (
                  <a
                    href={`https://wa.me/${cliente.telefone.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Enviar WhatsApp para ${cliente.nome}`}
                  >
                    <MessageCircle />
                  </a>
                )}
              </article>
            );
          })}
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

            <h2>Adicionar cliente</h2>

            <p>
              Cadastre os dados da sua cliente.
            </p>

            <form onSubmit={adicionarCliente}>
              <label>
                Nome

                <input
                  type="text"
                  placeholder="Nome da cliente"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  autoFocus
                />
              </label>

              <label>
                Telefone

                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(event.target.value)
                  }
                />
              </label>

              <label>
                Observações

                <textarea
                  placeholder="Alguma observação sobre a cliente..."
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(event.target.value)
                  }
                  rows={3}
                />
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
                  ) : (
                    "Salvar cliente"
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