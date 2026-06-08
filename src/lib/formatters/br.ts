const smallWords = new Set(["da", "das", "de", "do", "dos", "e"]);

export const brCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export const brDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
  year: "numeric",
});

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function parseBRL(value: string) {
  return Number(onlyDigits(value)) / 100;
}

export function formatBRL(value: string | number) {
  const amount = typeof value === "number" ? value : parseBRL(value);
  return brCurrencyFormatter.format(amount);
}

export function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function toTitleCaseBR(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
}

export function formatDateBR(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return brDateFormatter.format(new Date(year, month - 1, day));
}
