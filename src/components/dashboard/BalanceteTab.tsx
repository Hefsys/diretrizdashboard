import { useState, useMemo } from 'react';
import { useContabilStore } from '@/stores/useContabilStore';
import { formatBRL } from '@/lib/format-brl';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import EmptyState from './EmptyState';

const GROUPS = [
  { label: 'Todos', filter: '' },
  { label: 'Ativo', filter: '1' },
  { label: 'Passivo', filter: '2' },
  { label: 'Receitas', filter: '3' },
  { label: 'Custos/Despesas', filter: '4' },
];

const BalanceteTab = () => {
  const { balancete } = useContabilStore();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');

  const filtered = useMemo(() => {
    if (!balancete) return [];
    return balancete.contas.filter((conta) => {
      const matchGroup = !group || conta.classificacao.startsWith(group);
      const matchSearch = !search || conta.descricao.toLowerCase().includes(search.toLowerCase()) || conta.classificacao.includes(search);
      return matchGroup && matchSearch;
    });
  }, [balancete, search, group]);

  const maxMovimento = useMemo(() => {
    return Math.max(...filtered.map(c => c.debito + c.credito), 1);
  }, [filtered]);

  if (!balancete) return <EmptyState documentName="Balancete" />;

  return (
    <div className="space-y-4">
      <div data-pdf-section="kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Devedoras', value: balancete.resumo.totalDevedoras, color: 'text-primary' },
          { label: 'Total Credoras', value: balancete.resumo.totalCredoras, color: 'text-accent' },
          { label: 'Resultado', value: balancete.resumo.resultadoExercicio, color: balancete.resumo.resultadoExercicio >= 0 ? 'text-accent' : 'text-destructive' },
        ].map((item, i) => (
          <div key={item.label} className="bg-card rounded-xl border border-border p-4 animate-fade-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className={`font-heading text-lg font-bold ${item.color}`}>{formatBRL(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {GROUPS.map((g) => (
            <button key={g.label} onClick={() => setGroup(g.filter)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${group === g.filter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div data-pdf-section="tabela" className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Classificação</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Descrição</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Saldo Anterior</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Débito</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Crédito</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Saldo Atual</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Nat.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((conta, i) => {
                const movimento = conta.debito + conta.credito;
                const intensity = maxMovimento > 0 ? movimento / maxMovimento : 0;
                return (
                  <tr key={i} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${intensity > 0.7 ? 'bg-primary/5' : ''}`}>
                    <td className="py-2 px-4 text-muted-foreground font-mono text-xs">{conta.classificacao}</td>
                    <td className="py-2 px-4 text-foreground">{conta.descricao}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-muted-foreground">{formatBRL(conta.saldoAnterior)}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-primary">{formatBRL(conta.debito)}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-accent">{formatBRL(conta.credito)}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-foreground font-medium">{formatBRL(conta.saldoAtual)}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${conta.natureza === 'D' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'}`}>
                        {conta.natureza}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhuma conta encontrada.</div>
        )}
      </div>
    </div>
  );
};

export default BalanceteTab;
