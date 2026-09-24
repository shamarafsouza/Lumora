import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Financeiro.css";

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

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const Financeiro = () => {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarFinanceiro = async () => {
    setCarregando(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setCarregando(false);
      return;
    }

    const [financeiroResponse, despesasResponse] = await Promise.all([
      supabase
        .from("financeiro_atendimentos")
        .select(
          "id, agendamento_id, valor_recebido, forma_pagamento, custo_material, observacoes, created_at"
        )
        .eq("profissional_id", userData.user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("despesas")
        .select(
          "id, descricao, categoria, tipo, valor, data, observacoes"
        )
        .eq("profissional_id", userData.user.id)
        .order("data", { ascending: false }),
    ]);

    if (financeiroResponse.error) {
      console.error(
        "Erro ao carregar financeiro:",
        financeiroResponse.error
      );
    }

    if (despesasResponse.error) {
      console.error(
        "Erro ao carregar despesas:",
        despesasResponse.error
      );
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

    setCarregando(false);
  };

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

    const despesasAvulsas = despesas.reduce(
      (total, item) => total + item.valor,
      0
    );

    const custos = materiais + despesasAvulsas;

    return {
      receitas,
      materiais,
      despesasAvulsas,
      custos,
      resultado: receitas - custos,
    };
  }, [lancamentos, despesas]);

  return (
    <main className="financeiro-page">
      <header className="financeiro-header">
        <div>
          <span className="financeiro-eyebrow">LUMORA</span>
          <h1>Financeiro</h1>
          <p>Acompanhe as entradas e saídas do seu negócio.</p>
        </div>

        <button
          className="financeiro-add"
          type="button"
          title="Adicionar despesa"
        >
          <Plus size={20} />
        </button>
      </header>

      <section className="financeiro-resumo">
        <div className="financeiro-card receita">
          <div className="financeiro-card-icon">
            <ArrowUp size={18} />
          </div>

          <span>Receitas</span>
          <strong>{formatarMoeda(totais.receitas)}</strong>
        </div>

        <div className="financeiro-card custo">
          <div className="financeiro-card-icon">
            <ArrowDown size={18} />
          </div>

          <span>Custos e despesas</span>
          <strong>{formatarMoeda(totais.custos)}</strong>
        </div>

        <div className="financeiro-card resultado">
          <div className="financeiro-card-icon">
            <Wallet size={18} />
          </div>

          <span>Resultado</span>
          <strong>{formatarMoeda(totais.resultado)}</strong>
        </div>
      </section>

      <section className="financeiro-detalhes">
        <div className="financeiro-section-header">
          <div>
            <h2>Atendimentos</h2>
            <p>Valores recebidos pelos serviços realizados.</p>
          </div>
        </div>

        {carregando ? (
          <div className="financeiro-vazio">
            Carregando financeiro...
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="financeiro-vazio">
            <Wallet size={32} />
            <strong>Nenhum atendimento financeiro</strong>
            <span>
              Quando você registrar valores recebidos, eles aparecerão aqui.
            </span>
          </div>
        ) : (
          <div className="financeiro-lista">
            {lancamentos.map((item) => (
              <article
                className="financeiro-lancamento"
                key={item.id}
              >
                <div>
                  <strong>Atendimento</strong>

                  <span>
                    {new Date(item.created_at).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>

                  <small>
                    Pagamento: {item.forma_pagamento}
                  </small>
                </div>

                <div className="financeiro-valores">
                  <strong>
                    {formatarMoeda(item.valor_recebido)}
                  </strong>

                  {item.custo_material > 0 && (
                    <small>
                      Material:{" "}
                      {formatarMoeda(item.custo_material)}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="financeiro-detalhes">
        <div className="financeiro-section-header">
          <div>
            <h2>Despesas</h2>
            <p>Gastos registrados separadamente dos atendimentos.</p>
          </div>
        </div>

        {despesas.length === 0 ? (
          <div className="financeiro-vazio">
            <ArrowDown size={32} />
            <strong>Nenhuma despesa registrada</strong>
            <span>
              Suas despesas fixas e avulsas aparecerão aqui.
            </span>
          </div>
        ) : (
          <div className="financeiro-lista">
            {despesas.map((despesa) => (
              <article
                className="financeiro-lancamento"
                key={despesa.id}
              >
                <div>
                  <strong>{despesa.descricao}</strong>

                  <span>
                    {despesa.categoria} · {despesa.tipo}
                  </span>

                  <small>
                    {new Date(
                      `${despesa.data}T00:00:00`
                    ).toLocaleDateString("pt-BR")}
                  </small>
                </div>

                <div className="financeiro-valores despesa-valor">
                  <strong>
                    - {formatarMoeda(despesa.valor)}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Financeiro;