import { MessageCircle } from "lucide-react";

import { clientes } from "../data";

export function Clientes() {
  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Lumora</h1>
          <p>Lista de Clientes Cadastradas</p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="clients-title">
        <h2>Minhas Clientes</h2>
        <b>6 Total</b>
      </div>

      <div className="clients">
        {clientes.map((c) => (
          <article className="client-card" key={c.id}>
            <div className="initials">
              {c.nome
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div className="client-info">
              <strong>{c.nome}</strong>
              <span>Última visita: {c.ultimaVisita}</span>
            </div>

            <a
              href={`https://wa.me/${c.telefone}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle />
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}