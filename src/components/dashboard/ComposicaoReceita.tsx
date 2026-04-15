import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';

const COLORS = {
  positive: '#3b82f6',
  negative: '#ef4444',
  result: '#10b981',
};

const ComposicaoReceita = () => {
  const { dre } = useContabilStore();

  const data = [
    { name: 'Receita Bruta', value: dre?.receitaBruta ?? 0, type: 'positive' },
    { name: '(-) Deduções', value: -(dre?.deducoes.total ?? 0), type: 'negative' },
    { name: 'Receita Líquida', value: dre?.receitaLiquida ?? 0, type: 'positive' },
    { name: '(-) CMV', value: -(dre?.cmv ?? 0), type: 'negative' },
    { name: 'Lucro Bruto', value: dre?.lucroBruto ?? 0, type: 'positive' },
    { name: '(-) Despesas', value: -(dre?.despesasOperacionais.total ?? 0), type: 'negative' },
    { name: 'Lucro Líquido', value: dre?.lucroLiquido ?? 0, type: 'result' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">
        Composição da Receita
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatBRL(Math.abs(value))}
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(217, 33%, 20%)',
              borderRadius: 8,
              color: 'hsl(210, 40%, 96%)',
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.type === 'negative'
                    ? COLORS.negative
                    : entry.type === 'result'
                    ? COLORS.result
                    : COLORS.positive
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComposicaoReceita;
