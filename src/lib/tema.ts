export const COR_PADRAO = "#96264e";

function escurecer(hex: string, fator = 0.75) {
  const n = parseInt(hex.slice(1), 16);

  const r = Math.round(((n >> 16) & 255) * fator);
  const g = Math.round(((n >> 8) & 255) * fator);
  const b = Math.round((n & 255) * fator);

  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function aplicarCor(hex?: string | null) {
  const cor =
    hex && /^#[0-9a-fA-F]{6}$/.test(hex)
      ? hex
      : COR_PADRAO;

  const raiz = document.documentElement.style;

  raiz.setProperty("--wine", cor);
  raiz.setProperty("--wine-dark", escurecer(cor));
}