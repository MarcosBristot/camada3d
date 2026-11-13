/** Data local no formato do Postgres (YYYY-MM-DD), sem o deslocamento de fuso do toISOString. */
export function hojeISO(offsetDias = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  return d.toLocaleDateString('sv-SE')
}

/** '2026-11-13' -> '13/11/2026' (sem converter fuso: a data é só data). */
export function formatarData(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
