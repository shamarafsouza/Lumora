import { Clock3 } from "lucide-react";

import { servicos } from "../data";

export function Servicos() {
  const groups = Object.groupBy(
    servicos,
    (s) => s.categoria
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

      {Object.entries(groups).map(([cat, list]) => (
        <section className="service-group" key={cat}>
          <h2>{cat}</h2>

          {list?.map((s) => (
            <article className="service-card" key={s.id}>
              <div>
                <strong>{s.nome}</strong>

                <span>
                  <Clock3 />
                  {s.duracao}m
                </span>
              </div>

              <b>
                R$ {s.preco.toFixed(2).replace(".", ",")}
              </b>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}