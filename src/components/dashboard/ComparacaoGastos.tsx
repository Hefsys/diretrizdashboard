import { useContabilStore } from '@/stores/useContabilStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatBRL } from '@/lib/format-brl';

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'];

const ComparacaoGastos = () => {
  const { dre } = useContabilStore();
  if (!dre) return null;

  const desp = dre.despesasOperacionais;
  const data = [
    { name: 'CMV', value: Math.abs(dre.cmv) },
    { name: 'Pessoal', value: Math.abs(desp.pessoal.total) },
    { name: 'Impostos/Taxas', value: Math.abs(desp.impostosTaxas.total) },
    { name: 'Desp. Gerais', value: Math.abs(desp.despesasGerais.total) },
    { name: 'Desp. Financeiras', value: Math.abs(desp.despesasFinanceiras.total) },
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Comparação de Gastos</h3>
      <ResponsiveContainer width="100%" height={data.length * 50 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 80 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            width={110}
          />
          <Tooltip
            formatter={(value: number) => formatBRL(value)}
            contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', formatter: (v: number) => formatBRL(v), fill: 'hsl(215, 20%, 65%)', fontSize: 10 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparacaoGastos;
