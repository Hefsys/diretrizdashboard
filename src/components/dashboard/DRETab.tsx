import type { ReactNode } from 'react';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import EmptyState from './EmptyState';
import DistribuicaoDespesas from './DistribuicaoDespesas';

interface DRELineProps {
  label: string;
  value: number;
  indent?: number;
  bold?: boolean;
  maxValue: number;
}

const DRELine = ({ label, value, indent = 0, bold = false, maxValue }: DRELineProps) => {
  const isNeg = value < 0;
  const barWidth = maxValue !== 0 ? (Math.abs(value) / maxValue) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 py-2 px-4 border-b border-border/50 hover:bg-secondary/20 transition-colors ${bold ? 'bg-secondary/10' : ''}`}
      style={{ paddingLeft: `${16 + indent * 20}px` }}
    >
      <span className={`flex-1 text-sm ${bold ? 'font-heading font-semibold text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <div className="w-32 h-2 bg-secondary/30 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isNeg ? 'bg-destructive/60' : 'bg-accent/60'}`}
          style={{ width: `${Math.min(barWidth, 100)}%` }}
        />
      </div>
      <span className={`text-sm tabular-nums min-w-[130px] text-right ${bold ? 'font-heading font-bold' : 'font-medium'} ${isNeg ? 'text-destructive' : 'text-accent'}`}>
        {formatBRL(value)}
      </span>
    </div>
  );
};

interface DREGroupLineProps extends DRELineProps {
  children: ReactNode;
}

const DREGroupLine = ({ label, value, indent = 0, bold = false, maxValue, children }: DREGroupLineProps) => (
  <Collapsible>
    <CollapsibleTrigger className="group w-full text-left">
      <div
        className={`flex items-center gap-3 py-2 px-4 border-b border-border/50 hover:bg-secondary/20 transition-colors ${bold ? 'bg-secondary/10' : ''}`}
        style={{ paddingLeft: `${16 + indent * 20}px` }}
      >
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        <span className={`flex-1 text-sm ${bold ? 'font-heading font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <span className={`text-sm tabular-nums min-w-[130px] text-right ${bold ? 'font-heading font-bold' : 'font-medium'} ${value < 0 ? 'text-destructive' : 'text-accent'}`}>
          {formatBRL(value)}
        </span>
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>
);

const DRETab = () => {
  const { dre } = useContabilStore();

  if (!dre) return <EmptyState documentName="Demonstração do Resultado (DRE)" />;

  const maxValue = Math.abs(dre.receitaBruta) || 1;
  const deducoes = dre.deducoes as typeof dre.deducoes & { simplesNacional?: number; outras?: number };
  const deducoesTotalAbs = Math.abs(deducoes.total || 0);
  const devolucoesAbs = Math.abs(deducoes.devolucoes || 0);
  const outrasDeducoes = deducoes.outras || 0;
  const simplesNacional = deducoes.simplesNacional || -Math.max(deducoesTotalAbs - devolucoesAbs - Math.abs(outrasDeducoes), 0);
  const pessoal = dre.despesasOperacionais.pessoal as typeof dre.despesasOperacionais.pessoal & { proLabore?: number };
  const linhasPessoal = [
    { label: 'Salários', value: pessoal.salarios },
    { label: 'Pró-labore', value: pessoal.proLabore || 0 },
    { label: 'Férias', value: pessoal.ferias },
    { label: 'INSS', value: pessoal.inss },
    { label: 'FGTS', value: pessoal.fgts },
    { label: 'Outros', value: pessoal.outros },
  ].filter(item => Math.abs(item.value) > 0);
  const linhasGerais = [
    { label: 'Energia', value: dre.despesasOperacionais.despesasGerais.energia },
    { label: 'Água', value: dre.despesasOperacionais.despesasGerais.agua },
    { label: 'Seguros', value: dre.despesasOperacionais.despesasGerais.seguros },
    { label: 'Serviços / Assistência contábil', value: dre.despesasOperacionais.despesasGerais.servicos },
    { label: 'Fretes', value: dre.despesasOperacionais.despesasGerais.fretes },
    { label: 'Materiais', value: dre.despesasOperacionais.despesasGerais.materiais },
    { label: 'Outros', value: dre.despesasOperacionais.despesasGerais.outros },
  ].filter(item => Math.abs(item.value) > 0);
  const linhasFinanceiras = [
    { label: 'Juros', value: dre.despesasOperacionais.despesasFinanceiras.juros },
    { label: 'Tarifas', value: dre.despesasOperacionais.despesasFinanceiras.tarifas },
    { label: 'IOF', value: dre.despesasOperacionais.despesasFinanceiras.iof },
  ].filter(item => Math.abs(item.value) > 0);

  const waterfallData = [
    { name: 'Receita Bruta', value: dre.receitaBruta, type: 'positive' },
    { name: 'Deduções', value: -Math.abs(dre.deducoes.total), type: 'negative' },
    { name: 'Receita Líquida', value: dre.receitaLiquida, type: 'positive' },
    { name: 'CMV', value: -Math.abs(dre.cmv), type: 'negative' },
    { name: 'Lucro Bruto', value: dre.lucroBruto, type: 'positive' },
    { name: 'Despesas', value: -Math.abs(dre.despesasOperacionais.total), type: 'negative' },
    { name: 'Lucro Líquido', value: dre.lucroLiquido, type: 'result' },
  ];

  return (
    <div className="space-y-6">
      <div data-pdf-section="tabela" className="bg-card rounded-xl border border-border overflow-hidden animate-fade-slide-up">
        <div className="bg-primary/10 px-4 py-3 border-b border-border">
          <h3 className="font-heading font-bold text-foreground">Demonstração do Resultado do Exercício</h3>
        </div>
        <DRELine label="RECEITA OPERACIONAL BRUTA" value={dre.receitaBruta} bold maxValue={maxValue} />
        {devolucoesAbs > 0 && <DRELine label="(-) Devoluções" value={-devolucoesAbs} indent={1} maxValue={maxValue} />}
        {Math.abs(simplesNacional) > 0 && <DRELine label="(-) Simples Nacional" value={-Math.abs(simplesNacional)} indent={1} maxValue={maxValue} />}
        {Math.abs(outrasDeducoes) > 0 && <DRELine label="(-) Outras deduções" value={-Math.abs(outrasDeducoes)} indent={1} maxValue={maxValue} />}
        <DRELine label="TOTAL DEDUÇÕES" value={-deducoesTotalAbs} bold indent={1} maxValue={maxValue} />
        <DRELine label="RECEITA OPERACIONAL LÍQUIDA" value={dre.receitaLiquida} bold maxValue={maxValue} />
        <DRELine label="(-) Custo das Mercadorias Vendidas" value={-Math.abs(dre.cmv)} indent={1} maxValue={maxValue} />
        <DRELine label="LUCRO BRUTO" value={dre.lucroBruto} bold maxValue={maxValue} />
        {Math.abs(dre.despesasOperacionais.pessoal.total) > 0 && (
          <DREGroupLine label="(-) Despesas com Pessoal" value={-Math.abs(dre.despesasOperacionais.pessoal.total)} indent={1} bold maxValue={maxValue}>
            {linhasPessoal.map(item => <DRELine key={item.label} label={item.label} value={-Math.abs(item.value)} indent={2} maxValue={maxValue} />)}
          </DREGroupLine>
        )}
        {Math.abs(dre.despesasOperacionais.impostosTaxas.total) > 0 && <DRELine label="(-) Impostos e Taxas" value={-Math.abs(dre.despesasOperacionais.impostosTaxas.total)} indent={1} maxValue={maxValue} />}
        {Math.abs(dre.despesasOperacionais.despesasGerais.total) > 0 && (
          <DREGroupLine label="(-) Despesas Gerais" value={-Math.abs(dre.despesasOperacionais.despesasGerais.total)} indent={1} bold maxValue={maxValue}>
            {linhasGerais.map(item => <DRELine key={item.label} label={item.label} value={-Math.abs(item.value)} indent={2} maxValue={maxValue} />)}
          </DREGroupLine>
        )}
        {Math.abs(dre.despesasOperacionais.despesasFinanceiras.total) > 0 && (
          <DREGroupLine label="(-) Despesas Financeiras" value={-Math.abs(dre.despesasOperacionais.despesasFinanceiras.total)} indent={1} bold maxValue={maxValue}>
            {linhasFinanceiras.map(item => <DRELine key={item.label} label={item.label} value={-Math.abs(item.value)} indent={2} maxValue={maxValue} />)}
          </DREGroupLine>
        )}
        <DRELine label="TOTAL DESPESAS OPERACIONAIS" value={-Math.abs(dre.despesasOperacionais.total)} bold indent={1} maxValue={maxValue} />
        <DRELine label="(+) Receitas Financeiras" value={dre.receitasFinanceiras} indent={1} maxValue={maxValue} />
        <DRELine label="(+) Outras Receitas" value={dre.outrasReceitas} indent={1} maxValue={maxValue} />
        <DRELine label="RESULTADO OPERACIONAL" value={dre.resultadoOperacional} bold maxValue={maxValue} />
        <DRELine label="LUCRO/PREJUÍZO LÍQUIDO" value={dre.lucroLiquido} bold maxValue={maxValue} />
      </div>

      <div data-pdf-section="graficos-1" className="bg-card rounded-xl border border-border p-5 animate-fade-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
        <h3 className="font-heading text-base font-semibold text-foreground mb-4">Waterfall — Receita → Lucro</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} margin={{ bottom: 10 }}>
            <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
            <YAxis hide />
            <Tooltip formatter={(value: number) => formatBRL(Math.abs(value))} contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.type === 'negative' ? '#ef4444' : entry.type === 'result' ? '#10b981' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div data-pdf-section="graficos-2">
        <DistribuicaoDespesas />
      </div>
    </div>
  );
};

export default DRETab;
