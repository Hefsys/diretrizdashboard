/**
 * Formata um número para o padrão monetário brasileiro.
 * Ex: 1234567.89 → "R$ 1.234.567,89"
 *     -255178.23 → "(R$ 255.178,23)"
 */
export function formatBRL(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return 'R$ 0,00';

  const isNeg = value < 0;
  const abs = Math.abs(value);

  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNeg ? `(R$ ${formatted})` : `R$ ${formatted}`;
}

/**
 * Formata valor abreviado para KPI cards.
 * Ex: 1234567 → "R$ 1,2M"
 *     45000   → "R$ 45,0K"
 */
export function formatBRLShort(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return 'R$ 0';

  const isNeg = value < 0;
  const abs = Math.abs(value);

  let formatted: string;
  if (abs >= 1_000_000_000) {
    formatted = `R$ ${(abs / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}B`;
  } else if (abs >= 1_000_000) {
    formatted = `R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  } else if (abs >= 1_000) {
    formatted = `R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
  } else {
    formatted = `R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  }

  return isNeg ? `(${formatted})` : formatted;
}

/**
 * Formata porcentagem.
 * Ex: 0.1534 → "15,3%"
 */
export function formatPercent(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '0,0%';
  return `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

/**
 * Tooltip formatter for Recharts
 */
export function brlTooltipFormatter(value: number): string {
  return formatBRL(value);
}
