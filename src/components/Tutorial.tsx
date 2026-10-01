import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  PartyPopper,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

import type { Page } from "./BottomNav";

type Passo = {
  icone: ReactNode;
  titulo: string;
  texto: string;
  dica?: string;
  destino?: Page;
  rotuloDestino?: string;
};

export function Tutorial({
  nome,
  onIr,
  onFechar,
}: {
  nome?: string;
  onIr: (pagina: Page) => void;
  onFechar: () => void;
}) {
  const [indice, setIndice] = useState(0);

  const passos: Passo[] = [
    {
      icone: <PartyPopper size={26} />,
      titulo: nome
        ? `Bem-vinda, ${nome}!`
        : "Bem-vinda ao Lumora!",
      texto:
        "Vou te mostrar em 1 minutinho como organizar sua agenda, suas clientes e o seu financeiro. Dá para pular e rever quando quiser.",
    },
    {
      icone: <Users size={26} />,
      titulo: "1. Cadastre suas clientes",
      texto:
        "Na aba Clientes, toque em adicionar e preencha o nome e o WhatsApp. Com o telefone salvo, você manda o lembrete do horário com um toque.",
      dica:
        "Cadastre a cliente antes de marcar o primeiro horário.",
      destino: "clientes",
      rotuloDestino: "Ir para Clientes",
    },
    {
      icone: <Sparkles size={26} />,
      titulo: "2. Cadastre seus serviços",
      texto:
        "Na aba Serviços, adicione cada procedimento com nome, duração e preço. Exemplo: Unha de gel, 120 minutos, R$ 150,00.",
      dica:
        "Escolha também os produtos usados em cada serviço. O Lumora calcula o custo do material sozinho.",
      destino: "servicos",
      rotuloDestino: "Ir para Serviços",
    },
    {
      icone: <CalendarDays size={26} />,
      titulo: "3. Marque na Agenda",
      texto:
        "Toque em um horário disponível ou no botão +, escolha a cliente e o serviço. Depois, toque no atendimento para acessar as opções dele.",
      dica:
        "Na Agenda você também pode definir os dias em que atende e o intervalo de almoço.",
      destino: "agenda",
      rotuloDestino: "Ir para Agenda",
    },
    {
      icone: <CheckCircle2 size={26} />,
      titulo: "4. Conclua o atendimento",
      texto:
        "Quando terminar, toque no atendimento e em Concluir. Informe o valor recebido e a forma de pagamento. Ele vira uma entrada no Financeiro, já com o custo do material.",
    },
    {
      icone: <Wallet size={26} />,
      titulo: "5. Entradas e saídas",
      texto:
        "No Financeiro, Nova entrada registra dinheiro que entrou e Nova saída registra o que você gastou, como aluguel, materiais e energia.",
      dica:
        "Em Produtos e custos você cadastra gel, primer, lixas e outros produtos com o preço pago.",
      destino: "financeiro",
      rotuloDestino: "Ir para Financeiro",
    },
    {
      icone: <PartyPopper size={26} />,
      titulo: "Tudo pronto!",
      texto:
        "Comece cadastrando sua primeira cliente e seu primeiro serviço. Para rever este guia depois, vá em Perfil e toque em Ver tutorial do app.",
    },
  ];

  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;

  return (
    <div
      className="tutorial-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-titulo"
    >
      <section className="tutorial-card">
        <button
          type="button"
          className="tutorial-fechar"
          onClick={onFechar}
          aria-label="Fechar tutorial"
        >
          <X size={18} />
        </button>

        <div className="tutorial-icone">
          {passo.icone}
        </div>

        <h2 id="tutorial-titulo">
          {passo.titulo}
        </h2>

        <p>{passo.texto}</p>

        {passo.dica && (
          <div className="tutorial-dica">
            💡 {passo.dica}
          </div>
        )}

        {passo.destino && (
          <button
            type="button"
            className="tutorial-ir"
            onClick={() =>
              onIr(passo.destino as Page)
            }
          >
            {passo.rotuloDestino}
            <ArrowRight size={14} />
          </button>
        )}

        <div className="tutorial-pontos">
          {passos.map((_, i) => (
            <span
              key={i}
              className={
                i === indice ? "ativo" : ""
              }
            />
          ))}
        </div>

        <div className="tutorial-acoes">
          <button
            type="button"
            className="tutorial-secundario"
            onClick={() =>
              indice > 0
                ? setIndice(indice - 1)
                : onFechar()
            }
          >
            {indice > 0 ? "Voltar" : "Pular"}
          </button>

          <button
            type="button"
            className="tutorial-principal"
            onClick={() =>
              ultimo
                ? onFechar()
                : setIndice(indice + 1)
            }
          >
            {ultimo
              ? "Começar a usar"
              : indice === 0
                ? "Vamos começar!"
                : "Próximo"}
          </button>
        </div>
      </section>
    </div>
  );
}
