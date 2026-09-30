import { useEffect, useState, type ChangeEvent } from "react";
import {
  MapPin,
  Phone,
  Save,
  User,
  Building2,
  FileText,
  LogOut,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { aplicarCor } from "../lib/tema";

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
  cor_principal: "#96264e",
};

export default function Perfil({
  onVoltar,
}: {
  onVoltar: () => void;
}) {
  const [config, setConfig] = useState(configuracaoInicial);
  const [usuarioId, setUsuarioId] = useState("");
  const [email, setEmail] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    carregarPerfil();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

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

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome, telefone")
      .eq("id", user.id)
      .maybeSingle();

    const { data: negocio, error: erroNegocio } =
      await supabase
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

    const cor = negocio?.cor_principal ?? "#96264e";

    const logoUrl = negocio?.logo_url ?? "";

    setConfig({
      nome_negocio: negocio?.nome_negocio ?? "",
      nome_profissional:
        negocio?.nome_profissional ?? perfil?.nome ?? "",
      telefone:
        negocio?.telefone ?? perfil?.telefone ?? "",
      instagram: negocio?.instagram ?? "",
      cidade: negocio?.cidade ?? "",
      endereco: negocio?.endereco ?? "",
      descricao: negocio?.descricao ?? "",
      logo_url: logoUrl,
      cor_principal: cor,
    });

    setLogoPreview(logoUrl);
    setLogoArquivo(null);

    aplicarCor(cor);

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

    if (campo === "cor_principal") {
      aplicarCor(valor);
    }
  }

  function selecionarLogo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setMensagem("");
    setErro("");

    if (!arquivo.type.startsWith("image/")) {
      setErro(
        "Selecione uma imagem válida em PNG, JPG ou WEBP."
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    const preview = URL.createObjectURL(arquivo);

    setLogoArquivo(arquivo);
    setLogoPreview(preview);

    event.target.value = "";
  }

  function removerLogoSelecionada() {
    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoArquivo(null);
    setLogoPreview(config.logo_url);
    setMensagem("");
  }

  async function enviarLogo(): Promise<string | null> {
    if (!logoArquivo || !usuarioId) {
      return config.logo_url.trim() || null;
    }

    const extensao =
      logoArquivo.name.split(".").pop()?.toLowerCase() || "jpg";

    const caminho =
      `${usuarioId}/logo-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("logos")
      .upload(caminho, logoArquivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: logoArquivo.type,
      });

    if (erroUpload) {
      console.error("Erro ao enviar logo:", erroUpload);
      throw new Error(
        "Não foi possível enviar a logo. Verifique o armazenamento de imagens."
      );
    }

    const { data } = supabase.storage
      .from("logos")
      .getPublicUrl(caminho);

    if (!data.publicUrl) {
      throw new Error(
        "A imagem foi enviada, mas não foi possível obter o endereço da logo."
      );
    }

    return data.publicUrl;
  }

  async function salvarPerfil() {
    if (!usuarioId) return;

    setSalvando(true);
    setMensagem("");
    setErro("");

    let logoUrl = config.logo_url.trim();

    try {
      if (logoArquivo) {
        const novaLogoUrl = await enviarLogo();

        if (!novaLogoUrl) {
          throw new Error("Não foi possível obter a nova logo.");
        }

        logoUrl = novaLogoUrl;
      }
    } catch (uploadError) {
      console.error(uploadError);
      setErro(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a logo."
      );
      setSalvando(false);
      return;
    }

    const { error } = await supabase
      .from("configuracoes_negocio")
      .upsert(
        {
          profissional_id: usuarioId,
          nome_negocio: config.nome_negocio.trim(),
          nome_profissional:
            config.nome_profissional.trim(),
          telefone: config.telefone.trim(),
          instagram: config.instagram.trim(),
          cidade: config.cidade.trim(),
          endereco: config.endereco.trim(),
          descricao: config.descricao.trim(),
          logo_url: logoUrl,
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

    setConfig((atual) => ({
      ...atual,
      logo_url: logoUrl,
    }));

    setLogoArquivo(null);
    setLogoPreview(logoUrl);

    aplicarCor(config.cor_principal);

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
      <button
        type="button"
        className="perfil-voltar"
        onClick={onVoltar}
        aria-label="Voltar para o início"
      >
        ← Voltar
      </button>

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

          <div className="perfil-logo-area">
            <div
              className="perfil-logo-preview"
              style={{
                borderColor: config.cor_principal,
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
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
                Escolha uma imagem da galeria ou dos
                arquivos do seu dispositivo.
              </span>

              <div className="perfil-logo-actions">
                <input
                  id="perfil-logo-galeria"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  onChange={selecionarLogo}
                  hidden
                />

                <input
                  id="perfil-logo-arquivos"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  onChange={selecionarLogo}
                  hidden
                />

                <label
                  htmlFor="perfil-logo-galeria"
                  className="perfil-upload-button"
                >
                  <ImageIcon size={17} />
                  Galeria
                </label>

                <label
                  htmlFor="perfil-logo-arquivos"
                  className="perfil-upload-button perfil-upload-button-secondary"
                >
                  <FolderOpen size={17} />
                  Arquivos
                </label>

                {logoArquivo && (
                  <button
                    type="button"
                    className="perfil-remover-logo"
                    onClick={removerLogoSelecionada}
                  >
                    Remover seleção
                  </button>
                )}
              </div>

              <small>
                PNG, JPG ou WEBP · máximo de 5 MB
              </small>
            </div>
          </div>

          <div className="perfil-form-grid">
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

          </div>
        </section>

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
