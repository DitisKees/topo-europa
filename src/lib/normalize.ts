export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        prev + cost,
      );
      prev = tmp;
    }
  }
  return row[b.length] ?? 99;
}

export function matchesAnswer(
  input: string,
  canonical: string,
  aliases: string[] = [],
): boolean {
  const needle = fold(input);
  if (!needle) return false;
  const pool = [canonical, ...aliases].map(fold).filter(Boolean);
  if (pool.includes(needle)) return true;
  return pool.some((candidate) => {
    const max = candidate.length >= 8 ? 2 : 1;
    return candidate.length >= 5 && levenshtein(needle, candidate) <= max;
  });
}
