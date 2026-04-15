import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/format-brl';

interface Props {
  title: string;
  value: number;
  total: number;
  color: string;
  subtitle?: string;
}

const LucratividadeDonut = ({ title, value, total, color, subtitle }: Props) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const data = [
    { name: 'valor', value: Math.abs(pct) },
    { name: 'rest', value: Math.max(100 - Math.abs(pct), 0) },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up">
      <h3 className="font-heading text-base font-semibold text-foreground mb-2">{title}</h3>
      {subtitle && <p className="text-muted-foreground text-xs mb-3">{subtitle}</p>}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="hsl(217, 33%, 17%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-heading text-2xl font-bold" style={{ color }}>
            {pct.toFixed(1).replace('.', ',')}%
          </span>
          <span className="text-muted-foreground text-xs mt-1">{formatBRL(value)}</span>
        </div>
      </div>
    </div>
  );
};

export default LucratividadeDonut;
