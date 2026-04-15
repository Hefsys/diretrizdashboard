import { useContabilStore } from '@/stores/useContabilStore';
import { formatPercent } from '@/lib/format-brl';
import { useCountUp } from '@/hooks/useCountUp';

interface KPICardProps {
  label: string;
  value: number;
  suffix: string;
  desc: string;
  color: string;
  delay: number;
}

const KPICard = ({ label, value, suffix, desc, color, delay }: KPICardProps) => {
  const animated = useCountUp(value, 1200);
  return (
    <div
      className="bg-card rounded-xl border border-border p-4 animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <p className="text-muted-foreground text-xs mb-1">{desc}</p>
      <p className="font-heading text-xl font-bold" style={{ color }}>
        {animated.toFixed(1).replace('.', ',')}{suffix}
      </p>
      <p className="text-foreground text-sm font-medium mt-1">{label}</p>
    </div>
  );
};

const KPICardsExtras = () => {
  const { dre, balanco } = useContabilStore();

  const cards: KPICardProps[] = [];

  if (dre) {
    const margemBruta = dre.receitaLiquida > 0 ? (dre.lucroBruto / dre.receitaLiquida) * 100 : 0;
    const margemOp = dre.receitaLiquida > 0 ? (dre.resultadoOperacional / dre.receitaLiquida) * 100 : 0;
    cards.push({ label: 'Margem Bruta', value: margemBruta, suffix: '%', desc: 'Lucro Bruto / Rec. Líquida', color: '#f59e0b', delay: 0 });
    cards.push({ label: 'Margem Operacional', value: margemOp, suffix: '%', desc: 'Resultado Op. / Rec. Líquida', color: '#06b6d4', delay: 100 });
  }

  if (dre && balanco) {
    const pl = balanco.passivo.patrimonioLiquido.total;
    const at = balanco.ativo.total;
    const roe = pl > 0 ? (dre.lucroLiquido / pl) * 100 : 0;
    const roa = at > 0 ? (dre.lucroLiquido / at) * 100 : 0;
    cards.push({ label: 'ROE', value: roe, suffix: '%', desc: 'Lucro Líq. / Patrimônio Líq.', color: '#8b5cf6', delay: 200 });
    cards.push({ label: 'ROA', value: roa, suffix: '%', desc: 'Lucro Líq. / Ativo Total', color: '#10b981', delay: 300 });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default KPICardsExtras;
