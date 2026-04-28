import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useContabilStore } from '@/stores/useContabilStore';
import { getDocumentGroup } from '@/lib/document-types';
import { formatBRL, formatBRLShort } from '@/lib/format-brl';
import EmptyState from './EmptyState';

type MetricKey = 'receitaBruta' | 'receitaLiquida' | 'despesas' | 'lucroBruto' | 'resultadoOperacional' | 'lucroLiquido';

interface HistoricoPonto {
  periodo: string;
  ano: string;
  ordem: number;
  receitaBruta: number;
  receitaLiquida: number;
  despesas: number;
  lucroBruto: number;
  resultadoOperacional: number;
  lucroLiquido: number;
  ativoTotal?: number;
  resultadoBalancete?: number;
}

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'receitaBruta', label: 'Faturamento', color: 'hsl(var(--primary))' },
  { key: 'receitaLiquida', label: 'Receita líquida', color: 'hsl(var(--accent))' },
  { key: 'despesas', label: 'Despesas', color: 'hsl(var(--destructive))' },
  { key: 'lucroBruto', label: 'Lucro bruto', color: 'hsl(var(--foreground))' },
  { key: 'resultadoOperacional', label: 'Resultado op.', color: 'hsl(var(--muted-foreground))' },
  { key: 'lucroLiquido', label: 'Lucro líquido', color: 'hsl(var(--secondary-foreground))' },
];

const parsePeriodoOrdem = (periodo?: string | null, fallback = 0) => {
  const match = periodo?.match(/(\d{1,2})\D+(\d{4})/);
  if (!match) return { label: periodo || 'Sem período', ano: 'Sem ano', ordem: fallback };
  const mes = match[1].padStart(2, '0');
  const ano = match[2];
  return { label: `${mes}/${ano}`, ano, ordem: Number(ano) * 100 + Number(mes) };
};

const variacaoPercentual = (atual: number, anterior: number) => {
  if (!anterior) return atual ? 1 : 0;
  return (atual - anterior) / Math.abs(anterior);
};

const HistoricoTab = () => {
  const { empresaId } = useContabilStore();
  const [loading, setLoading] = useState(false);
  const [pontos, setPontos] = useState<HistoricoPonto[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['receitaBruta', 'despesas', 'lucroLiquido']);
  const [selectedAno, setSelectedAno] = useState('todos');

  useEffect(() => {
    if (!empresaId) return;

    const carregarHistorico = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentos')
        .select('tipo, periodo, dados_parseados, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        setPontos([]);
        setLoading(false);
        return;
      }

      const porPeriodo = new Map<string, HistoricoPonto>();
      data.forEach((doc, index) => {
        const periodoInfo = parsePeriodoOrdem(doc.periodo, index);
        const key = periodoInfo.label;
        const atual = porPeriodo.get(key) || {
          periodo: key,
          ano: periodoInfo.ano,
          ordem: periodoInfo.ordem,
          receitaBruta: 0,
          receitaLiquida: 0,
          despesas: 0,
          lucroBruto: 0,
          resultadoOperacional: 0,
          lucroLiquido: 0,
        };

        const dados = doc.dados_parseados as any;
        const group = getDocumentGroup(doc.tipo);
        if (group === 'dre') {
          atual.receitaBruta = Number(dados?.receitaBruta || 0);
          atual.receitaLiquida = Number(dados?.receitaLiquida || 0);
          atual.despesas = Math.abs(Number(dados?.despesasOperacionais?.total || 0));
          atual.lucroBruto = Number(dados?.lucroBruto || 0);
          atual.resultadoOperacional = Number(dados?.resultadoOperacional || 0);
          atual.lucroLiquido = Number(dados?.lucroLiquido || 0);
        } else if (group === 'balanco') {
          atual.ativoTotal = Number(dados?.ativo?.total || 0);
        } else if (group === 'balancete') {
          atual.resultadoBalancete = Number(dados?.resumo?.resultadoExercicio || 0);
        }
        porPeriodo.set(key, atual);
      });

      setPontos(Array.from(porPeriodo.values()).sort((a, b) => a.ordem - b.ordem));
      setLoading(false);
    };

    carregarHistorico();
  }, [empresaId]);

  const anos = useMemo(() => Array.from(new Set(pontos.map(p => p.ano))).filter(a => a !== 'Sem ano'), [pontos]);
  const dadosFiltrados = useMemo(() => pontos.filter(p => selectedAno === 'todos' || p.ano === selectedAno), [pontos, selectedAno]);
  const atual = dadosFiltrados[dadosFiltrados.length - 1];
  const anterior = dadosFiltrados[dadosFiltrados.length - 2];

  const impactos = useMemo(() => {
    if (!atual || !anterior) return [];
    return METRICS.map(metric => ({
      label: metric.label,
      delta: atual[metric.key] - anterior[metric.key],
      perc: variacaoPercentual(atual[metric.key], anterior[metric.key]),
    }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 4);
  }, [atual, anterior]);

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics(prev => prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]);
  };

  if (!empresaId) return <EmptyState documentName="histórico da empresa" />;
  if (loading) return <div className="text-center text-muted-foreground py-10">Carregando histórico...</div>;
  if (pontos.length < 2) return <EmptyState documentName="DREs de períodos diferentes para comparar a evolução" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Faturamento', value: atual?.receitaBruta || 0, previous: anterior?.receitaBruta || 0 },
          { label: 'Despesas', value: atual?.despesas || 0, previous: anterior?.despesas || 0 },
          { label: 'Lucro líquido', value: atual?.lucroLiquido || 0, previous: anterior?.lucroLiquido || 0 },
        ].map((card) => {
          const delta = variacaoPercentual(card.value, card.previous);
          const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          return (
            <div key={card.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Icon className={`w-4 h-4 ${delta >= 0 ? 'text-accent' : 'text-destructive'}`} />
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{formatBRLShort(card.value)}</p>
              <p className="text-xs text-muted-foreground mt-1">{(delta * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs. período anterior</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {METRICS.map(metric => (
              <button key={metric.key} onClick={() => toggleMetric(metric.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMetrics.includes(metric.key) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {metric.label}
              </button>
            ))}
          </div>
          {anos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedAno('todos')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedAno === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Todos os anos</button>
              {anos.map(ano => (
                <button key={ano} onClick={() => setSelectedAno(ano)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedAno === ano ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{ano}</button>
              ))}
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={dadosFiltrados} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={formatBRLShort} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
            <Legend />
            {METRICS.filter(metric => selectedMetrics.includes(metric.key)).map(metric => (
              <Line key={metric.key} type="monotone" dataKey={metric.key} name={metric.label} stroke={metric.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading text-base font-semibold text-foreground mb-4">Comparação ano a ano</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dadosFiltrados}>
              <XAxis dataKey="periodo" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="receitaBruta" name="Faturamento" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="lucroLiquido" name="Lucro líquido" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-base font-semibold text-foreground">O que impactou</h3>
          </div>
          <div className="space-y-3">
            {impactos.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.perc >= 0 ? 'Aumento' : 'Queda'} de {Math.abs(item.perc * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${item.delta >= 0 ? 'text-accent' : 'text-destructive'}`}>{formatBRL(item.delta)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoTab;