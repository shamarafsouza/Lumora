import { useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";

import { agendamentos, clientes, servicos } from "../data";

export function Agenda() {
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      agendamentos.map((a) => ({
        ...a,
        cliente: clientes.find((c) => c.id === a.clienteId)!,
        servico: servicos.find((s) => s.id === a.servicoId)!,
      })),
    []
  );

  const current = rows.find((r) => r.id === selected);

  return (
    <main className="page agenda-page">
      <header className="top">
        <div>
          <h1>Lumora</h1>
          <p>Quinta, 24 de Outubro</p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="week">
        <span>
          Ter
          <br />
          <b>22</b>
        </span>

        <span>
          Qua
          <br />
          <b>23</b>
        </span>

        <span className="selected-day">
          Qui
          <br />
          <b>24</b>
        </span>

        <span>
          Sex
          <br />
          <b>25</b>
        </span>

        <span>
          Sáb
          <br />
          <b>26</b>
        </span>

        <span>
          Dom
          <br />
          <b>27</b>
        </span>
      </div>

      <section className="timeline">
        <Slot
          time="08:00"
          item={rows[0]}
          onClick={() => setSelected(rows[0].id)}
        />

        <Slot
          time="10:00"
          item={rows[1]}
          onClick={() => setSelected(rows[1].id)}
        />

        <div className="available">
          <span>11:30</span>
          <b>Disponível</b>
        </div>

        <Slot
          time="14:00"
          item={rows[2]}
          onClick={() => setSelected(rows[2].id)}
        />
      </section>

      {current && (
        <div
          className="sheet-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>

            <div className="handle" />

            <h2>{current.cliente.nome}</h2>

            <p className="muted">
              Hoje às {current.horario} •{" "}
              {current.status === "pendente"
                ? "Pendente"
                : "Confirmado"}
            </p>

            <div className="detail">
              <span>Procedimento:</span>
              <b>{current.servico.nome}</b>

              <span>Duração:</span>
              <b>{current.servico.duracao} minutos</b>
            </div>

            <div className="money">
              <div>
                <span>Valor cobrado</span>
                <b>
                  R${" "}
                  {current.servico.preco
                    .toFixed(2)
                    .replace(".", ",")}
                </b>
              </div>

              <div>
                <span>Gasto de Material</span>
                <b className="gold">R$ 22,00</b>
              </div>
            </div>

            <a
              className="whatsapp"
              href={`https://wa.me/${
                current.cliente.telefone
              }?text=${encodeURIComponent(
                `Olá, ${current.cliente.nome}! 💅 Passando para confirmar seu horário hoje às ${current.horario}.`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle />
              Enviar lembrete no WhatsApp
            </a>

            <div className="sheet-actions">
              <button>Concluir Atendimento</button>
              <button>Editar</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Slot({
  time,
  item,
  onClick,
}: {
  time: string;
  item: any;
  onClick: () => void;
}) {
  return (
    <button
      className={`appointment ${item.status}`}
      onClick={onClick}
    >
      <span className="slot-time">{time}</span>

      <div>
        <strong>{item.cliente.nome}</strong>
        <small>{item.servico.nome}</small>
      </div>

      <em>
        {item.status === "confirmado"
          ? "Confirmado"
          : "Pendente"}
      </em>
    </button>
  );
}