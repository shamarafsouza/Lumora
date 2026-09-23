export function Financeiro() {
  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Lumora</h1>
          <p>Fluxo de Caixa Mensal</p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="metrics">
        <div>
          <span>Faturamento</span>
          <b>R$ 2.450</b>
        </div>

        <div>
          <span>Gastos</span>
          <b>R$ 820</b>
        </div>

        <div>
          <span>Lucro Líquido</span>
          <b>R$ 1.630</b>
        </div>
      </div>

      <h2>Histórico Recente</h2>

      <div className="history">
        {[
          [
            "Mariana Silva",
            "Manutenção de Gel + Nail Art",
            "R$ 110,00",
            "R$ 15,00",
          ],
          [
            "Beatriz Costa",
            "Pé e Mão Simples",
            "R$ 65,00",
            "R$ 8,00",
          ],
          [
            "Gasto de Material Geral",
            "Compra de Brocas e Lixas",
            "- R$ 120,00",
            "",
          ],
          [
            "Carla Rezende",
            "Alongamento Fibra",
            "R$ 180,00",
            "R$ 22,00",
          ],
          [
            "Aluguel da Sala",
            "Custo Fixo",
            "- R$ 450,00",
            "",
          ],
          [
            "Fernanda Lima",
            "Blindagem de Unhas",
            "R$ 90,00",
            "R$ 12,00",
          ],
        ].map((x, i) => (
          <article className="history-card" key={i}>
            <div>
              <strong>{x[0]}</strong>
              <span>{x[1]}</span>

              {x[3] && (
                <small>
                  Custo de material: {x[3]}
                </small>
              )}
            </div>

            <b className={x[2].startsWith("-") ? "expense" : ""}>
              {x[2]}
            </b>
          </article>
        ))}
      </div>
    </main>
  );
}