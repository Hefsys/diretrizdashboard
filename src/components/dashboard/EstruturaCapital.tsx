import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';

const COLORS = ['#ef4444', '#10b981'];

const EstruturaCapital = () => {
  const { balanco } = useContabilStore();

  const data = [
    { name: 'Passivo Circulante', value: Math.abs(balanco?.passivo.circulante.total ?? 0) },
    { name: 'Patrimônio Líquido', value: Math.abs(balanco?.passivo.patrimonioLiquido.total ?? 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Estrutura de Capital
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

export default EstruturaCapital;
