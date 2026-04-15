import { useState } from 'react';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import EmptyState from './EmptyState';
import ComposicaoPassivo from './ComposicaoPassivo';
import CapacidadePagamento from './CapacidadePagamento';

interface GroupProps {
  title: string;
  items: { label: string; value: number }[];
  total: number;
  defaultOpen?: boolean;
}

const CollapsibleGroup = ({ title, items, total, defaultOpen = false }: GroupProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <span className="font-heading font-semibold text-sm text-foreground">{title}</span>
        </div>
        <span className="font-heading font-bold text-sm text-foreground">{formatBRL(total)}</span>
      </button>
      {open && (
        <div className="pb-2">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between py-1.5 px-10 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground tabular-nums">{formatBRL(item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const BalancoTab = () => {
  const { balanco } = useContabilStore();
  if (!balanco) return <EmptyState documentName="Balanço Patrimonial" />;

  const ac = balanco.ativo.circulante;
  const anc = balanco.ativo.naoCirculante;
  const pc = balanco.passivo.circulante;
  const pl = balanco.passivo.patrimonioLiquido;

  const liquidezCorrente = pc.total !== 0 ? ac.total / pc.total : null;
  const liquidezSeca = pc.total !== 0 ? (ac.total - ac.estoques) / pc.total : null;
  const endividamento = balanco.ativo.total !== 0 ? (pc.total / balanco.ativo.total) * 100 : 0;
  const participacaoPL = balanco.passivo.total !== 0 ? (pl.total / balanco.passivo.total) * 100 : 0;

  const indicators = [
    { label: 'Liquidez Corrente', value: liquidezCorrente !== null ? liquidezCorrente.toFixed(2) : 'N/A', desc: 'AC / PC' },
    { label: 'Liquidez Seca', value: liquidezSeca !== null ? liquidezSeca.toFixed(2) : 'N/A', desc: '(AC - Estoques) / PC' },
    { label: 'Endividamento', value: `${endividamento.toFixed(2)}%`, desc: 'PC / Ativo Total' },
    { label: 'Participação do PL', value: `${participacaoPL.toFixed(2)}%`, desc: 'PL / Passivo Total' },
  ];

  const donutData = [
    { name: 'Disponível', value: ac.disponivel.total },
    { name: 'Clientes', value: ac.clientes },
    { name: 'Outros Créditos', value: ac.outrosCreditos },
    { name: 'Estoques', value: ac.estoques },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Ativo', Circulante: ac.total, 'Não Circulante': anc.total },
    { name: 'Passivo + PL', Circulante: pc.total, 'Patrimônio Líquido': pl.total },
  ];

  return (
    <div className="space-y-6">
      {/* Indicators */}
      <div data-pdf-section="kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind, i) => (
          <div key={ind.label} className="bg-card rounded-xl border border-border p-4 animate-fade-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
            <p className="text-muted-foreground text-xs mb-1">{ind.desc}</p>
            <p className="font-heading text-xl font-bold text-primary">{ind.value}</p>
            <p className="text-foreground text-sm font-medium mt-1">{ind.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div data-pdf-section="graficos-1" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut - Composição do Ativo */}
        <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <h3 className="font-heading text-base font-semibold text-foreground mb-4">Composição do Ativo Circulante</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
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

        {/* Bar - Ativo vs Passivo+PL */}
        <div className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
          <h3 className="font-heading text-base font-semibold text-foreground mb-4">Ativo vs Passivo + PL</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
              <Legend formatter={(v: string) => <span style={{ color: 'hsl(215, 20%, 55%)', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Circulante" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Não Circulante" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Patrimônio Líquido" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Passivo composition + Payment capacity */}
      <div data-pdf-section="graficos-2" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComposicaoPassivo />
        <CapacidadePagamento />
      </div>

      {/* Detail tables */}
      <div data-pdf-section="tabela" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <div className="bg-primary/10 px-4 py-3 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-foreground">ATIVO</h3>
              <span className="font-heading font-bold text-primary">{formatBRL(balanco.ativo.total)}</span>
            </div>
          </div>
          <CollapsibleGroup title="Circulante" defaultOpen total={ac.total} items={[
            { label: 'Caixa', value: ac.disponivel.caixa },
            { label: 'Bancos', value: ac.disponivel.bancos },
            { label: 'Aplicações', value: ac.disponivel.aplicacoes },
            { label: 'Clientes', value: ac.clientes },
            { label: 'Outros Créditos', value: ac.outrosCreditos },
            { label: 'Estoques', value: ac.estoques },
          ]} />
          <CollapsibleGroup title="Não Circulante" total={anc.total} items={[{ label: 'Imobilizado', value: anc.imobilizado }]} />
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          <div className="bg-accent/10 px-4 py-3 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-foreground">PASSIVO + PL</h3>
              <span className="font-heading font-bold text-accent">{formatBRL(balanco.passivo.total)}</span>
            </div>
          </div>
          <CollapsibleGroup title="Circulante" defaultOpen total={pc.total} items={[
            { label: 'Fornecedores', value: pc.fornecedores },
            { label: 'Obrig. Tributárias', value: pc.obrigacoesTributarias },
            { label: 'Obrig. Trabalhistas', value: pc.obrigacoesTrabalhistas },
            { label: 'Outras Obrigações', value: pc.outrasObrigacoes },
          ]} />
          <CollapsibleGroup title="Patrimônio Líquido" total={pl.total} items={[
            { label: 'Capital Social', value: pl.capitalSocial },
            { label: 'Lucros Acumulados', value: pl.lucrosAcumulados },
            { label: 'Ajustes de Exercícios', value: pl.ajustesExercicios },
          ]} />
        </div>
      </div>
    </div>
  );
};

export default BalancoTab;
