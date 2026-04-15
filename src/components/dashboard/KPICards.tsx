import { TrendingUp, DollarSign, Percent, Landmark } from 'lucide-react';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRLShort, formatPercent } from '@/lib/format-brl';
import { useCountUp } from '@/hooks/useCountUp';

const AnimatedValue = ({ value, formatter }: { value: number; formatter: (v: number) => string }) => {
  const animated = useCountUp(value);
  return <>{formatter(animated)}</>;
};

const KPICards = () => {
  const { dre, balanco } = useContabilStore();

  const receitaBruta = dre?.receitaBruta ?? 0;
  const lucroLiquido = dre?.lucroLiquido ?? 0;
  const margemLiquida = receitaBruta !== 0 ? lucroLiquido / receitaBruta : 0;
  const ativoTotal = balanco?.ativo.total ?? 0;

  const cards = [
    {
      label: 'Receita Bruta',
      value: receitaBruta,
      formatter: formatBRLShort,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Lucro Líquido',
      value: lucroLiquido,
      formatter: formatBRLShort,
      icon: DollarSign,
      color: lucroLiquido >= 0 ? 'text-accent' : 'text-destructive',
      bgColor: lucroLiquido >= 0 ? 'bg-accent/10' : 'bg-destructive/10',
    },
    {
      label: 'Margem Líquida',
      value: margemLiquida,
      formatter: formatPercent,
      icon: Percent,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Ativo Total',
      value: ativoTotal,
      formatter: formatBRLShort,
      icon: Landmark,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up"
          style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-sm font-medium">{card.label}</span>
            <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <p className={`font-heading text-2xl font-bold ${card.color}`}>
            <AnimatedValue value={card.value} formatter={card.formatter} />
          </p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
