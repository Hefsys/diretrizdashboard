import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Trash2, Eye, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getDocumentGroup, getDocumentGroupLabel } from '@/lib/document-types';
import { Json } from '@/integrations/supabase/types';

interface Documento {
  id: string;
  tipo: string;
  nome_arquivo: string;
  arquivo_path: string | null;
  periodo: string | null;
  created_at: string;
  dados_parseados: Json;
}

const TIPO_LABELS: Record<string, string> = {
  'balanco': 'Balanço',
  'balancete': 'Balancete',
  'dre-detalhada': 'DRE Detalhada',
  'dre-sintetica': 'DRE Sintética',
};

interface DocumentHistoryProps {
  empresaId: string | null;
  onLoadDocumento: (doc: Documento) => void;
  onOpenPdf?: (doc: Documento) => void;
  refreshKey?: number;
}

const DocumentHistory = ({ empresaId, onLoadDocumento, onOpenPdf, refreshKey }: DocumentHistoryProps) => {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [openPeriods, setOpenPeriods] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!empresaId) { setDocs([]); return; }
    fetchDocs();
  }, [empresaId, refreshKey]);

  const fetchDocs = async () => {
    if (!empresaId) return;
    const { data } = await supabase
      .from('documentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (data) setDocs(data as Documento[]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('documentos').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.success('Documento excluído');
  };

  const togglePeriod = (period: string) => {
    setOpenPeriods(prev => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  };

  if (!empresaId || docs.length === 0) return null;

  const latestIds = new Set<string>();
  for (const doc of docs) {
    const group = getDocumentGroup(doc.tipo);
    if (group !== 'desconhecido' && !Array.from(latestIds).some(id => docs.find(d => d.id === id && getDocumentGroup(d.tipo) === group))) {
      latestIds.add(doc.id);
    }
  }

  // Group by periodo
  const grouped: Record<string, Documento[]> = {};
  for (const doc of docs) {
    const key = doc.periodo || 'Sem período';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  }

  const periods = Object.keys(grouped);

  return (
    <div className="space-y-2 animate-fade-slide-up">
      <h3 className="text-sm font-heading font-semibold text-foreground">Histórico de envios</h3>
      <div className="space-y-1">
        {periods.map(period => (
          <Collapsible key={period} open={openPeriods.has(period)} onOpenChange={() => togglePeriod(period)}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-secondary/50 transition-colors text-left">
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openPeriods.has(period) ? 'rotate-90' : ''}`} />
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground flex-1">{period}</span>
              <span className="text-xs text-muted-foreground">{grouped[period].length} doc(s)</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-6 space-y-1 mt-1">
                {grouped[period].map(doc => {
                  const isLatest = latestIds.has(doc.id);
                  const group = getDocumentGroup(doc.tipo);
                  return (
                  <div key={doc.id} className="flex items-center gap-3 p-2 rounded-md bg-card border border-border/50 group">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{doc.nome_arquivo}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{TIPO_LABELS[doc.tipo] || doc.tipo} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                        {isLatest && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{getDocumentGroupLabel(group)}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.arquivo_path && onOpenPdf && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenPdf(doc)} title="Ver PDF">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoadDocumento(doc)} title="Carregar dados">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default DocumentHistory;
