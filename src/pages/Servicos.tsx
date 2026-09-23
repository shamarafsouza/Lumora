import { Clock3 } from "lucide-react";

import { servicos } from "../data";
import type { Servico } from "../types";

export function Servicos() {
  const groups = servicos.reduce<Record<string, Servico[]>>(
    (acc, servico) => {
      if (!acc[servico.categoria]) {
        acc[servico.categoria] = [];
      }

      acc[servico.categoria].push(servico);

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

      {Object.entries(groups).map(([categoria, lista]) => (
        <section className="service-group" key={categoria}>
          <h2>{categoria}</h2>

          {lista.map((servico) => (
            <article className="service-card" key={servico.id}>
              <div>
                <strong>{servico.nome}</strong>

                <span>
                  <Clock3 />
                  {servico.duracao}m
                </span>
              </div>

              <b>
                R$ {servico.preco.toFixed(2).replace(".", ",")}
              </b>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}