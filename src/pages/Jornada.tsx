import { useEffect, useState } from "react";
import { Clock3, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

type DiaSemana = {
  numero: number;
  nome: string;
  abreviacao: string;
  ativo: boolean;
};

const diasIniciais: DiaSemana[] = [
  { numero: 1, nome: "Segunda-feira", abreviacao: "SEG", ativo: true },
  { numero: 2, nome: "Terça-feira", abreviacao: "TER", ativo: true },
  { numero: 3, nome: "Quarta-feira", abreviacao: "QUA", ativo: true },
  { numero: 4, nome: "Quinta-feira", abreviacao: "QUI", ativo: true },
  { numero: 5, nome: "Sexta-feira", abreviacao: "SEX", ativo: true },
  { numero: 6, nome: "Sábado", abreviacao: "SÁB", ativo: false },
  { numero: 7, nome: "Domingo", abreviacao: "DOM", ativo: false },
];

export default function Jornada() {
  const [dias, setDias] = useState<DiaSemana[]>(diasIniciais);

  const [intervaloInicio, setIntervaloInicio] =
    useState("12:00");

  const [intervaloFim, setIntervaloFim] =
    useState("13:00");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarJornada();
  }, []);

  async function carregarJornada() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("horarios_trabalho")
      .select(
        "dia_semana, ativo, intervalo_inicio, intervalo_fim"
      )
      .eq("profissional_id", user.id)
      .order("dia_semana");

    if (error) {
      console.error(error);
      setErro(
        error.message ||
          "Não foi possível carregar sua jornada."
      );
      setCarregando(false);
      return;
    }

    if (data && data.length > 0) {
      setDias((atual) =>
        atual.map((dia) => {
          const salvo = data.find(
            (item) => item.dia_semana === dia.numero
          );

          if (!salvo) {
            return dia;
          }

          return {
            ...dia,
            ativo: salvo.ativo,
          };
        })
      );

      const primeiro = data.find(
        (item) =>
          item.intervalo_inicio &&
          item.intervalo_fim
      );

      if (primeiro) {
        setIntervaloInicio(
          String(primeiro.intervalo_inicio).slice(0, 5)
        );

        setIntervaloFim(
          String(primeiro.intervalo_fim).slice(0, 5)
        );
      }
    }

    setCarregando(false);
  }

  function alternarDia(numero: number) {
    setDias((atual) =>
      atual.map((dia) =>
        dia.numero === numero
          ? { ...dia, ativo: !dia.ativo }
          : dia
      )
    );
  }

  async function salvarJornada() {
    setSalvando(true);
    setMensagem("");
    setErro("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Faça login novamente.");
      setSalvando(false);
      return;
    }

    if (intervaloFim <= intervaloInicio) {
      setErro(
        "O horário final do almoço precisa ser depois do horário inicial."
      );
      setSalvando(false);
      return;
    }

    const registros = dias.map((dia) => ({
      profissional_id: user.id,
      dia_semana: dia.numero,
      ativo: dia.ativo,
      intervalo_inicio: dia.ativo
        ? intervaloInicio
        : null,
      intervalo_fim: dia.ativo
        ? intervaloFim
        : null,
    }));

    const { error } = await supabase
      .from("horarios_trabalho")
      .upsert(registros, {
        onConflict: "profissional_id,dia_semana",
      });

    if (error) {
      console.error(error);

      setErro(
        error.message ||
          "Não foi possível salvar sua jornada."
      );

      setSalvando(false);
      return;
    }

    setMensagem("Jornada salva com sucesso.");
    setSalvando(false);

    setTimeout(() => {
      setMensagem("");
    }, 3000);
  }

  if (carregando) {
    return (
      <main className="page jornada-page">
        <div className="jornada-loading">
          <Clock3 size={22} />
          <span>Carregando sua jornada...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page jornada-page">
      <header className="top">
        <div>
          <span className="jornada-eyebrow">
            LUMORA
          </span>

          <h1>Minha jornada</h1>

          <p>
            Configure os dias em que você costuma
            atender.
          </p>
        </div>

        <div className="avatar">LU</div>
      </header>

      <section className="jornada-card">
        <div className="jornada-section-title">
          <div>
            <h2>Dias de atendimento</h2>

            <p>
              Selecione os dias em que você costuma
              trabalhar.
            </p>
          </div>
        </div>

        <div className="dias-lista">
          {dias.map((dia) => (
            <button
              type="button"
              key={dia.numero}
              className={`dia-item ${
                dia.ativo ? "ativo" : ""
              }`}
              onClick={() =>
                alternarDia(dia.numero)
              }
            >
              <span className="dia-abreviacao">
                {dia.abreviacao}
              </span>

              <span className="dia-nome">
                {dia.nome}
              </span>

              <span className="dia-check">
                {dia.ativo ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="jornada-card">
        <div className="jornada-section-title">
          <div className="jornada-title-icon">
            <Clock3 size={18} />
          </div>

          <div>
            <h2>Intervalo para almoço</h2>

            <p>
              O Lumora descontará esse período
              automaticamente.
            </p>
          </div>
        </div>

        <div className="intervalo-inputs">
          <label>
            <span>Início</span>

            <input
              type="time"
              value={intervaloInicio}
              onChange={(event) =>
                setIntervaloInicio(
                  event.target.value
                )
              }
            />
          </label>

          <span className="intervalo-separador">
            até
          </span>

          <label>
            <span>Fim</span>

            <input
              type="time"
              value={intervaloFim}
              onChange={(event) =>
                setIntervaloFim(
                  event.target.value
                )
              }
            />
          </label>
        </div>
      </section>

      <div className="jornada-info">
        <strong>
          O Lumora calcula o restante automaticamente.
        </strong>

        <p>
          Conforme você agenda seus clientes, o sistema
          calcula o tempo ocupado, horários livres e a
          utilização da sua agenda.
        </p>
      </div>

      {erro && (
        <div className="agenda-error">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="jornada-sucesso">
          {mensagem}
        </div>
      )}

      <button
        type="button"
        className="jornada-salvar"
        onClick={salvarJornada}
        disabled={salvando}
      >
        <Save size={18} />

        {salvando
          ? "Salvando..."
          : "Salvar jornada"}
      </button>
    </main>
  );
}
