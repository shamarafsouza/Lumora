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
  const [nome, setNome] = useState("Lumora");
  const [iniciais, setIniciais] = useState("LU");

  useEffect(() => {
    let montado = true;

    async function carregarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

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

      if (!montado) return;

      const nomePerfil =
        data?.nome?.trim() ||
        user.user_metadata?.nome?.trim() ||
        "Lumora";

      setNome(nomePerfil);

      const letras = nomePerfil
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) =>
          parte.charAt(0).toUpperCase()
        )
        .join("");

      setIniciais(letras || "LU");
    }

    carregarPerfil();

    return () => {
      montado = false;
    };
  }, []);

  return (
    <header className="top">
      <div>
        <h1>{nome}</h1>

        {subtitulo && (
          <p>{subtitulo}</p>
        )}
      </div>

      <div className="page-header-actions">
        {children}

        <button
          type="button"
          className="avatar page-avatar-button"
          onClick={onPerfil}
          aria-label="Abrir perfil"
          title="Perfil"
        >
          {iniciais || (
            <UserRound size={18} />
          )}
        </button>
      </div>
    </header>
  );
}
