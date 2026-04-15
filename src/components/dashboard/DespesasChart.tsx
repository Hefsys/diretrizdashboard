import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';

const DespesasChart = () => {
  const { dre } = useContabilStore();
  const desp = dre?.despesasOperacionais;

  const data = [
    { name: 'Pessoal', value: Math.abs(desp?.pessoal.total ?? 0), fill: '#3b82f6' },
    { name: 'Impostos/Taxas', value: Math.abs(desp?.impostosTaxas.total ?? 0), fill: '#f59e0b' },
    { name: 'Desp. Gerais', value: Math.abs(desp?.despesasGerais.total ?? 0), fill: '#8b5cf6' },
    { name: 'Desp. Financeiras', value: Math.abs(desp?.despesasFinanceiras.total ?? 0), fill: '#ef4444' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Despesas Operacionais
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ bottom: 10 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value: number) => formatBRL(value)}
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(217, 33%, 20%)',
              borderRadius: 8,
              color: 'hsl(210, 40%, 96%)',
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DespesasChart;
