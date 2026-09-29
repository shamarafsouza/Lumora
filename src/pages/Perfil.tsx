import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Save,
  User,
  Building2,
  FileText,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Perfil.css";

type ConfiguracaoNegocio = {
  id?: string;
  profissional_id: string;
  nome_negocio: string;
  nome_profissional: string;
  telefone: string;
  instagram: string;
  cidade: string;
  endereco: string;
  descricao: string;
  logo_url: string;
  cor_principal: string;
};

const configuracaoInicial: Omit<
  ConfiguracaoNegocio,
  "profissional_id"
> = {
  nome_negocio: "",
  nome_profissional: "",
  telefone: "",
  instagram: "",
  cidade: "",
  endereco: "",
  descricao: "",
  logo_url: "",
  cor_principal: "#6f263d",
};

export default function Perfil() {
  const [config, setConfig] = useState(configuracaoInicial);
  const [usuarioId, setUsuarioId] = useState("");
  const [email, setEmail] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    setCarregando(true);
    setErro("");

    const {
      data: { user },
      error: erroUsuario,
    } = await supabase.auth.getUser();

    if (erroUsuario || !user) {
      setErro("Não foi possível identificar o usuário.");
      setCarregando(false);
      return;
    }

    setUsuarioId(user.id);
    setEmail(user.email ?? "");

    // Dados básicos da conta
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome, telefone")
      .eq("id", user.id)
      .maybeSingle();

    // Dados personalizados do negócio
    const { data: negocio, error: erroNegocio } = await supabase
      .from("configuracoes_negocio")
      .select("*")
      .eq("profissional_id", user.id)
      .maybeSingle();

    if (erroNegocio) {
      console.error(erroNegocio);
      setErro("Não foi possível carregar os dados do negócio.");
      setCarregando(false);
      return;
    }

    setConfig({
      nome_negocio: negocio?.nome_negocio ?? "",
      nome_profissional:
        negocio?.nome_profissional ?? perfil?.nome ?? "",
      telefone: negocio?.telefone ?? perfil?.telefone ?? "",
      instagram: negocio?.instagram ?? "",
      cidade: negocio?.cidade ?? "",
      endereco: negocio?.endereco ?? "",
      descricao: negocio?.descricao ?? "",
      logo_url: negocio?.logo_url ?? "",
      cor_principal:
        negocio?.cor_principal ?? "#6f263d",
    });

    setCarregando(false);
  }

  function atualizarCampo(
    campo: keyof typeof configuracaoInicial,
    valor: string
  ) {
    setConfig((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarPerfil() {
    if (!usuarioId) return;

    setSalvando(true);
    setMensagem("");
    setErro("");

    const { error } = await supabase
      .from("configuracoes_negocio")
      .upsert(
        {
          profissional_id: usuarioId,
          nome_negocio: config.nome_negocio.trim(),
          nome_profissional: config.nome_profissional.trim(),
          telefone: config.telefone.trim(),
          instagram: config.instagram.trim(),
          cidade: config.cidade.trim(),
          endereco: config.endereco.trim(),
          descricao: config.descricao.trim(),
          logo_url: config.logo_url.trim(),
          cor_principal: config.cor_principal,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "profissional_id",
        }
      );

    if (error) {
      console.error(error);
      setErro("Não foi possível salvar as alterações.");
      setSalvando(false);
      return;
    }

    // Mantém nome e telefone sincronizados com o perfil da conta
    const { error: erroPerfil } = await supabase
      .from("profiles")
      .update({
        nome: config.nome_profissional.trim(),
        telefone: config.telefone.trim(),
      })
      .eq("id", usuarioId);

    if (erroPerfil) {
      console.error(erroPerfil);
    }

    setMensagem("Perfil atualizado com sucesso.");
    setSalvando(false);

    setTimeout(() => {
      setMensagem("");
    }, 3000);
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  if (carregando) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading-spinner" />
        <span>Carregando seu perfil...</span>
      </div>
    );
  }

  return (
    <main className="perfil-page">
      <div className="perfil-header">
        <div>
          <span className="perfil-eyebrow">
            MEU NEGÓCIO
          </span>

          <h1>Perfil</h1>

          <p>
            Personalize as informações que representam o
            seu negócio.
          </p>
        </div>
      </div>

      {mensagem && (
        <div className="perfil-alert perfil-alert-success">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="perfil-alert perfil-alert-error">
          {erro}
        </div>
      )}

      <div className="perfil-layout">
        {/* IDENTIDADE DO NEGÓCIO */}
        <section className="perfil-card perfil-identidade">
          <div className="perfil-card-header">
            <div className="perfil-card-icon">
              <Building2 size={20} />
            </div>

            <div>
              <h2>Identidade do negócio</h2>

              <p>
                Essas informações ajudam a apresentar
                sua marca.
              </p>
            </div>
          </div>

          {/* LOGO */}
          <div className="perfil-logo-area">
            <div
              className="perfil-logo-preview"
              style={{
                borderColor: config.cor_principal,
              }}
            >
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Logo do negócio"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Building2 size={34} />
              )}
            </div>

            <div className="perfil-logo-info">
              <strong>Logo do negócio</strong>

              <span>
                Informe a URL da imagem da sua logo
                abaixo.
              </span>
            </div>
          </div>

          <div className="perfil-form-grid">
            {/* NOME DO NEGÓCIO */}
            <label className="perfil-field perfil-field-full">
              <span>Nome do negócio</span>

              <div className="perfil-input-icon">
                <Building2 size={17} />

                <input
                  type="text"
                  value={config.nome_negocio}
                  onChange={(e) =>
                    atualizarCampo(
                      "nome_negocio",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Studio Shamara"
                />
              </div>
            </label>

            {/* NOME DA PROFISSIONAL */}
            <label className="perfil-field">
              <span>Seu nome</span>

              <div className="perfil-input-icon">
                <User size={17} />

                <input
                  type="text"
                  value={config.nome_profissional}
                  onChange={(e) =>
                    atualizarCampo(
                      "nome_profissional",
                      e.target.value
                    )
                  }
                  placeholder="Seu nome"
                />
              </div>
            </label>

            {/* TELEFONE */}
            <label className="perfil-field">
              <span>Telefone / WhatsApp</span>

              <div className="perfil-input-icon">
                <Phone size={17} />

                <input
                  type="tel"
                  value={config.telefone}
                  onChange={(e) =>
                    atualizarCampo(
                      "telefone",
                      e.target.value
                    )
                  }
                  placeholder="(27) 99999-9999"
                />
              </div>
            </label>

            {/* INSTAGRAM */}
            <label className="perfil-field">
              <span>Instagram</span>

              <div className="perfil-input-icon">
                <span className="perfil-instagram-icon">
                  @
                </span>

                <input
                  type="text"
                  value={config.instagram}
                  onChange={(e) =>
                    atualizarCampo(
                      "instagram",
                      e.target.value
                    )
                  }
                  placeholder="@seunegocio"
                />
              </div>
            </label>

            {/* CIDADE */}
            <label className="perfil-field">
              <span>Cidade</span>

              <div className="perfil-input-icon">
                <MapPin size={17} />

                <input
                  type="text"
                  value={config.cidade}
                  onChange={(e) =>
                    atualizarCampo(
                      "cidade",
                      e.target.value
                    )
                  }
                  placeholder="Sua cidade"
                />
              </div>
            </label>

            {/* ENDEREÇO */}
            <label className="perfil-field perfil-field-full">
              <span>Endereço</span>

              <div className="perfil-input-icon">
                <MapPin size={17} />

                <input
                  type="text"
                  value={config.endereco}
                  onChange={(e) =>
                    atualizarCampo(
                      "endereco",
                      e.target.value
                    )
                  }
                  placeholder="Rua, número, bairro..."
                />
              </div>
            </label>

            {/* DESCRIÇÃO */}
            <label className="perfil-field perfil-field-full">
              <span>Descrição do negócio</span>

              <div className="perfil-textarea-wrapper">
                <FileText size={17} />

                <textarea
                  value={config.descricao}
                  onChange={(e) =>
                    atualizarCampo(
                      "descricao",
                      e.target.value
                    )
                  }
                  placeholder="Conte um pouco sobre seu espaço e seu trabalho..."
                  rows={4}
                />
              </div>
            </label>

            {/* LOGO URL */}
            <label className="perfil-field perfil-field-full">
              <span>URL da logo</span>

              <input
                className="perfil-input"
                type="url"
                value={config.logo_url}
                onChange={(e) =>
                  atualizarCampo(
                    "logo_url",
                    e.target.value
                  )
                }
                placeholder="https://..."
              />
            </label>
          </div>
        </section>

        {/* PERSONALIZAÇÃO */}
        <section className="perfil-card">
          <div className="perfil-card-header">
            <div className="perfil-card-icon">
              <span className="perfil-color-dot" />
            </div>

            <div>
              <h2>Personalização</h2>

              <p>
                Escolha a cor principal usada na
                identidade do negócio.
              </p>
            </div>
          </div>

          <div className="perfil-color-picker">
            <div
              className="perfil-color-preview"
              style={{
                backgroundColor:
                  config.cor_principal,
              }}
            />

            <div>
              <strong>Cor principal</strong>

              <div className="perfil-color-controls">
                <input
                  type="color"
                  value={config.cor_principal}
                  onChange={(e) =>
                    atualizarCampo(
                      "cor_principal",
                      e.target.value
                    )
                  }
                />

                <input
                  className="perfil-input perfil-color-text"
                  type="text"
                  value={config.cor_principal}
                  onChange={(e) =>
                    atualizarCampo(
                      "cor_principal",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* CONTA */}
        <section className="perfil-card">
          <div className="perfil-card-header">
            <div className="perfil-card-icon">
              <User size={20} />
            </div>

            <div>
              <h2>Conta</h2>

              <p>
                Informações da sua conta Lumora.
              </p>
            </div>
          </div>

          <div className="perfil-conta">
            <div>
              <span>E-mail</span>

              <strong>
                {email || "Não informado"}
              </strong>
            </div>

            <button
              type="button"
              className="perfil-sair"
              onClick={sair}
            >
              <LogOut size={17} />

              Sair da conta
            </button>
          </div>
        </section>
      </div>

      {/* SALVAR */}
      <div className="perfil-footer">
        <button
          type="button"
          className="perfil-salvar"
          onClick={salvarPerfil}
          disabled={salvando}
        >
          <Save size={18} />

          {salvando
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>
    </main>
  );
}