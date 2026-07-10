export const slug = (name: string) => {
  const noDiacritics = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return !(code >= 0x0300 && code <= 0x036f);
    })
    .join("");
  return noDiacritics.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "anonyme";
};

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtDate = (iso: string) => {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const s = new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return s.toUpperCase();
  } catch {
    return iso;
  }
};

export const fmtAmount = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const emailForUsername = (username: string) => `${slug(username)}@carnet.local`;
