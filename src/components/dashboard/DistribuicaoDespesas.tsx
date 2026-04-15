import { useContabilStore } from '@/stores/useContabilStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatBRL } from '@/lib/format-brl';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

const DistribuicaoDespesas = () => {
  const { dre } = useContabilStore();
  if (!dre) return null;

  const desp = dre.despesasOperacionais;
  const data = [
    { name: 'CMV', value: Math.abs(dre.cmv) },
    { name: 'Pessoal', value: Math.abs(desp.pessoal.total) },
    { name: 'Impostos/Taxas', value: Math.abs(desp.impostosTaxas.total) },
    { name: 'Desp. Gerais', value: Math.abs(desp.despesasGerais.total) },
    { name: 'Desp. Financeiras', value: Math.abs(desp.despesasFinanceiras.total) },
  ].filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Distribuição de Custos e Despesas</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name} ${((value / total) * 100).toFixed(1)}%`}
            labelLine={{ stroke: 'hsl(215, 20%, 45%)' }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatBRL(value)}
            contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistribuicaoDespesas;
