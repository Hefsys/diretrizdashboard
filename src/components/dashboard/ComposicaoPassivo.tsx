import { useContabilStore } from '@/stores/useContabilStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatBRL } from '@/lib/format-brl';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const ComposicaoPassivo = () => {
  const { balanco } = useContabilStore();
  if (!balanco) return null;

  const pc = balanco.passivo.circulante;
  const data = [
    { name: 'Fornecedores', value: pc.fornecedores },
    { name: 'Obrig. Tributárias', value: pc.obrigacoesTributarias },
    { name: 'Obrig. Trabalhistas', value: pc.obrigacoesTrabalhistas },
    { name: 'Outras Obrigações', value: pc.outrasObrigacoes },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up">
      <h3 className="font-heading text-base font-semibold text-foreground mb-4">Composição do Passivo Circulante</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatBRL(value)}
            contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }}
          />
          <Legend formatter={(v: string) => <span style={{ color: 'hsl(215, 20%, 55%)', fontSize: 12 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComposicaoPassivo;
