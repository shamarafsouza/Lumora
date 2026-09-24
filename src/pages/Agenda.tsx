import { useMemo, useState } from "react";

type DiaSemana = {
  data: Date;
  nome: string;
};

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

  const [dataSelecionada, setDataSelecionada] =
    useState(hoje);

  const semanaAtual = useMemo(
    () => inicioDaSemana(dataSelecionada),
    [dataSelecionada]
  );

  const dias = useMemo<DiaSemana[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = new Date(semanaAtual);

      data.setDate(
        semanaAtual.getDate() + index
      );

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
              onClick={() =>
                setDataSelecionada(dia.data)
              }
            >
              <span>{dia.nome}</span>

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