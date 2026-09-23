import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DiaSemana = {
  data: Date;
  nome: string;
};

function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function formatarDiaCompleto(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function inicioDaSemana(data: Date) {
  const resultado = new Date(data);
  const dia = resultado.getDay();

  // Segunda-feira = 0
  const diferenca = dia === 0 ? -6 : 1 - dia;

  resultado.setDate(resultado.getDate() + diferenca);
  resultado.setHours(0, 0, 0, 0);

  return resultado;
}

function mesmaData(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Agenda() {
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);

  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  const [semanaAtual, setSemanaAtual] = useState(
    inicioDaSemana(hoje)
  );

  const dias = useMemo<DiaSemana[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = new Date(semanaAtual);

      data.setDate(semanaAtual.getDate() + index);

      return {
        data,
        nome: data
          .toLocaleDateString("pt-BR", {
            weekday: "short",
          })
          .replace(".", "")
          .slice(0, 3),
      };
    });
  }, [semanaAtual]);

  function selecionarDia(data: Date) {
    setDataSelecionada(data);
  }

  function semanaAnterior() {
    setSemanaAtual((atual) => {
      const nova = new Date(atual);
      nova.setDate(nova.getDate() - 7);
      return nova;
    });
  }

  function proximaSemana() {
    setSemanaAtual((atual) => {
      const nova = new Date(atual);
      nova.setDate(nova.getDate() + 7);
      return nova;
    });
  }

  function voltarParaHoje() {
    setDataSelecionada(hoje);
    setSemanaAtual(inicioDaSemana(hoje));
  }

  const horarios = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  return (
    <main className="page agenda-page">
      <header className="top">
        <div>
          <h1>Lumora</h1>

          <p>
            {formatarDiaCompleto(dataSelecionada)}
          </p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <div className="calendar-navigation">
        <button
          type="button"
          onClick={semanaAnterior}
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          className="today-button"
          onClick={voltarParaHoje}
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={proximaSemana}
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="week">
        {dias.map((dia) => {
          const selecionado = mesmaData(
            dia.data,
            dataSelecionada
          );

          return (
            <button
              key={dia.data.toISOString()}
              type="button"
              className={
                selecionado ? "selected-day" : ""
              }
              onClick={() => selecionarDia(dia.data)}
            >
              {dia.nome}
              <br />
              <b>{dia.data.getDate()}</b>
            </button>
          );
        })}
      </div>

      <section className="timeline">
        {horarios.map((horario) => (
          <div
            className="available"
            key={horario}
          >
            <span>{horario}</span>
            <b>Disponível</b>
          </div>
        ))}
      </section>
    </main>
  );
}