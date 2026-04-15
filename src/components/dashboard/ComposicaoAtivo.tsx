import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const ComposicaoAtivo = () => {
  const { balanco } = useContabilStore();
  const circ = balanco?.ativo.circulante;

  const data = [
    { name: 'Disponível', value: circ?.disponivel.total ?? 0 },
    { name: 'Clientes', value: circ?.clientes ?? 0 },
    { name: 'Outros Créditos', value: circ?.outrosCreditos ?? 0 },
    { name: 'Estoques', value: circ?.estoques ?? 0 },
    { name: 'Imobilizado', value: balanco?.ativo.naoCirculante.imobilizado ?? 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Composição do Ativo
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            animationDuration={800}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatBRL(value)}
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(217, 33%, 20%)',
              borderRadius: 8,
              color: 'hsl(210, 40%, 96%)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value: string) => (
              <span style={{ color: 'hsl(215, 20%, 55%)', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComposicaoAtivo;
