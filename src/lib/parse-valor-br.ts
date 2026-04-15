/**
 * Converte um valor monetário no formato brasileiro para number.
 *
 * Exemplos:
 *   "1.234.567,89"   → 1234567.89
 *   "(255.178,23)"   → -255178.23
 *   "1.234,56 D"     → 1234.56   (débito – positivo por padrão)
 *   "1.234,56 C"     → -1234.56  (crédito – negativo por padrão)
 *   ""               → 0
 *
 * @param texto  O texto com o valor
 * @param invertSign  Se true, inverte D/C (útil para contas de Passivo)
 */
export function parseValorBR(texto: string | undefined | null, invertSign = false): number {
  if (!texto) return 0;

  let t = texto.trim();
  if (!t) return 0;

  // Detecta sinal negativo por parênteses
  const isParenthesized = t.startsWith('(') && t.endsWith(')');
  if (isParenthesized) {
    t = t.slice(1, -1).trim();
  }

  // Detecta sufixo D ou C
  let suffix: 'D' | 'C' | null = null;
  const suffixMatch = t.match(/\s*([DC])\s*$/i);
  if (suffixMatch) {
    suffix = suffixMatch[1].toUpperCase() as 'D' | 'C';
    t = t.slice(0, -suffixMatch[0].length).trim();
  }

  // Remove pontos de milhar e troca vírgula por ponto
  t = t.replace(/\./g, '').replace(',', '.');

  // Remove qualquer caractere não numérico restante (ex: R$, espaços)
  t = t.replace(/[^\d.\-]/g, '');

  let value = parseFloat(t);
  if (isNaN(value)) return 0;

  // Aplica negativo por parênteses
  if (isParenthesized) value = -value;

  // Aplica lógica D/C
  if (suffix) {
    const isDebit = suffix === 'D';
    if (invertSign) {
      // Passivo: C = positivo, D = negativo
      value = isDebit ? -Math.abs(value) : Math.abs(value);
    } else {
      // Ativo: D = positivo, C = negativo
      value = isDebit ? Math.abs(value) : -Math.abs(value);
    }
  }

  return value;
}
