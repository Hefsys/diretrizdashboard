import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';

const CapacidadePagamento = () => {
  const { balanco } = useContabilStore();
  if (!balanco) return null;

  const disponivel = balanco.ativo.circulante.disponivel.total;
  const pc = balanco.passivo.circulante.total;
  const liquidezImediata = pc > 0 ? disponivel / pc : 0;

  const getStatus = (v: number) => {
    if (v >= 1) return { label: 'Excelente', color: '#10b981', bg: 'bg-green-500/10' };
    if (v >= 0.5) return { label: 'Bom', color: '#f59e0b', bg: 'bg-yellow-500/10' };
    if (v >= 0.2) return { label: 'Regular', color: '#f97316', bg: 'bg-orange-500/10' };
    return { label: 'Crítico', color: '#ef4444', bg: 'bg-red-500/10' };
  };

  const status = getStatus(liquidezImediata);
  const gaugePercent = Math.min(liquidezImediata * 100, 100);

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Capacidade de Pagamento Imediato</h3>
      
      <div className="flex flex-col items-center gap-4">
        {/* Gauge */}
        <div className="relative w-40 h-20 overflow-hidden">
          <div className="absolute inset-0 rounded-t-full border-[8px] border-border/30" />
          <div
            className="absolute inset-0 rounded-t-full border-[8px] border-transparent transition-all duration-1000"
            style={{
              borderTopColor: status.color,
              borderLeftColor: gaugePercent > 25 ? status.color : 'transparent',
              borderRightColor: gaugePercent > 75 ? status.color : 'transparent',
              transform: `rotate(${-90 + (gaugePercent / 100) * 180}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className="font-heading text-2xl font-bold" style={{ color: status.color }}>
              {liquidezImediata.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg}`} style={{ color: status.color }}>
          {status.label}
        </div>

        {/* Details */}
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Disponível</p>
            <p className="font-heading font-bold text-sm text-foreground">{formatBRL(disponivel)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Passivo Circulante</p>
            <p className="font-heading font-bold text-sm text-foreground">{formatBRL(pc)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacidadePagamento;
