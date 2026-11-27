// Convert known transport failures into useful, localized messages.
export function friendlyError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : '';
  if (/offline|internet connection|network request failed|failed to fetch|fetch failed|networkerror|load failed/i.test(message)) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
  }
  if (/abort|cancelled|canceled|timeout|timed out/i.test(message)) {
    return 'A consulta foi interrompida ou demorou demais. Tente novamente.';
  }
  if (/duplicate key|unique constraint|23505/i.test(message)) return fallback;
  return message || fallback;
}
