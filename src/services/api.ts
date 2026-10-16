/** Ponto central de integração futura com o backend do Financely Web.
 * Ainda NÃO realiza autenticação nem requisições autenticadas. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://financely-app.onrender.com';

export async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch(API_BASE_URL, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}
