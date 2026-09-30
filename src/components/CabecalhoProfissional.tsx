import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { supabase } from "../lib/supabase";

type CabecalhoProfissionalProps = {
  subtitulo?: string;
  children?: React.ReactNode;
  onPerfil?: () => void;
};

export function CabecalhoProfissional({
  subtitulo,
  children,
  onPerfil,
}: CabecalhoProfissionalProps) {
  const [nome, setNome] = useState("Você");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;

    async function carregarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (montado) {
          setCarregando(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar perfil:",
          error
        );
      }

      if (montado) {
        setNome(
          data?.nome?.trim() ||
            user.user_metadata?.nome?.trim() ||
            "Você"
        );

        setCarregando(false);
      }
    }

    carregarPerfil();

    return () => {
      montado = false;
    };
  }, []);

  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="cabecalho-profissional">
      <div className="cabecalho-profissional-info">
        <h1>
          {carregando ? "..." : nome}
        </h1>

        {subtitulo && (
          <p>{subtitulo}</p>
        )}
      </div>

      <div className="cabecalho-profissional-acoes">
        {children}

        <button
          type="button"
          className="cabecalho-profissional-avatar"
          onClick={onPerfil}
          aria-label="Abrir meu perfil"
        >
          {iniciais || (
            <UserRound size={18} />
          )}
        </button>
      </div>
    </header>
  );
}
