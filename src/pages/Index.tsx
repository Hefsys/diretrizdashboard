import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import CategoryDropZone from '@/components/CategoryDropZone';
import EmpresaSelector from '@/components/EmpresaSelector';
import PeriodoSelector from '@/components/PeriodoSelector';
import DocumentHistory from '@/components/DocumentHistory';
import { Button } from '@/components/ui/button';
import { parsePDF, ParsedPDF, ReportType } from '@/lib/pdf-parser';
import { getDocumentGroup } from '@/lib/document-types';
import { BarChart3, FlaskConical, Loader2 } from 'lucide-react';
import { useContabilStore } from '@/stores/useContabilStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
}

type CategoryKey = 'balanco' | 'dre' | 'balancete';

interface CategoryState {
  status: 'idle' | 'processing' | 'done' | 'error';
  fileName?: string;
  parsed?: ParsedPDF;
}

const CATEGORY_TYPES: Record<CategoryKey, ReportType[]> = {
  balanco: ['balanco'],
  dre: ['dre-detalhada', 'dre-sintetica'],
  balancete: ['balancete'],
};

const Index = () => {
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [categories, setCategories] = useState<Record<CategoryKey, CategoryState>>({
    balanco: { status: 'idle' },
    dre: { status: 'idle' },
    balancete: { status: 'idle' },
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [periodoMes, setPeriodoMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [periodoAno, setPeriodoAno] = useState(() => String(new Date().getFullYear()));

  const periodoFormatado = `${periodoMes}/${periodoAno}`;

  const { setFiles, empresa: storeEmpresa } = useContabilStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-select empresa from query param
  useEffect(() => {
    const empresaId = searchParams.get('empresa');
    if (empresaId && !selectedEmpresa) {
      supabase.from('empresas').select('*').eq('id', empresaId).maybeSingle().then(({ data }) => {
        if (data) setSelectedEmpresa(data);
      });
    }
  }, [searchParams]);

  const store = useContabilStore.getState();
  const hasData = Object.values(categories).some(c => c.status === 'done') || 
    store.balanco || store.dre || store.balancete;
  const isProcessing = Object.values(categories).some(c => c.status === 'processing');

  // Auto-load saved documents when empresa is selected
  useEffect(() => {
    if (!selectedEmpresa) return;
    loadEmpresaDocs(selectedEmpresa.id, selectedEmpresa.nome, selectedEmpresa.cnpj || '');
  }, [selectedEmpresa?.id]);

  const loadEmpresaDocs = async (empresaId: string, nome: string, cnpj: string) => {
    setLoadingEmpresa(true);
    try {
      // Get latest document of each type for this empresa
      const { data: docs } = await supabase
        .from('documentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (!docs || docs.length === 0) {
        // Reset store but set empresa info
        useContabilStore.setState({
          balanco: null,
          dre: null,
          balancete: null,
          empresa: nome,
          cnpj: cnpj,
          periodo: '',
        });
        setCategories({
          balanco: { status: 'idle' },
          dre: { status: 'idle' },
          balancete: { status: 'idle' },
        });
        setLoadingEmpresa(false);
        return;
      }

      // Take the most recent of each canonical type
      const latestByType: Record<string, any> = {};
      for (const doc of docs) {
        const key = getDocumentGroup(doc.tipo);
        if (!latestByType[key]) latestByType[key] = doc;
      }

      let periodo = '';
      const newCategories: Record<CategoryKey, CategoryState> = {
        balanco: { status: 'idle' },
        dre: { status: 'idle' },
        balancete: { status: 'idle' },
      };

      if (latestByType.balanco) {
        useContabilStore.setState({ balanco: latestByType.balanco.dados_parseados as any });
        newCategories.balanco = { status: 'done', fileName: latestByType.balanco.nome_arquivo };
        periodo = latestByType.balanco.periodo || periodo;
      } else {
        useContabilStore.setState({ balanco: null });
      }

      if (latestByType.dre) {
        useContabilStore.setState({ dre: latestByType.dre.dados_parseados as any });
        newCategories.dre = { status: 'done', fileName: latestByType.dre.nome_arquivo };
        periodo = latestByType.dre.periodo || periodo;
      } else {
        useContabilStore.setState({ dre: null });
      }

      if (latestByType.balancete) {
        useContabilStore.setState({ balancete: latestByType.balancete.dados_parseados as any });
        newCategories.balancete = { status: 'done', fileName: latestByType.balancete.nome_arquivo };
        periodo = latestByType.balancete.periodo || periodo;
      } else {
        useContabilStore.setState({ balancete: null });
      }

      useContabilStore.setState({ empresa: nome, cnpj, periodo });
      setCategories(newCategories);

      const loadedCount = Object.values(newCategories).filter(c => c.status === 'done').length;
      if (loadedCount > 0) {
        toast.success(`${loadedCount} documento(s) carregado(s) do histórico de ${nome}`);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos da empresa:', err);
    } finally {
      setLoadingEmpresa(false);
    }
  };

  const findOrCreateEmpresa = useCallback(async (cnpj: string, nome: string): Promise<Empresa | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    if (cnpj) {
      const { data: existing } = await supabase.from('empresas').select('*').eq('cnpj', cnpj).maybeSingle();
      if (existing) return existing;
    }
    const { data: created, error } = await supabase
      .from('empresas')
      .insert({ nome: nome || 'Empresa sem nome', cnpj: cnpj || null, user_id: user.id })
      .select()
      .single();
    if (error) { console.error('Erro ao criar empresa:', error); return null; }
    return created;
  }, []);

  const saveDocumento = useCallback(async (empresaId: string, parsed: ParsedPDF, periodo: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dadosMap: Record<string, any> = {};
    if (parsed.reportType === 'balanco') {
      const { parseBalanco } = await import('@/lib/parsers/balanco-parser');
      dadosMap.data = parseBalanco(parsed.textItems);
    } else if (parsed.reportType === 'dre-detalhada' || parsed.reportType === 'dre-sintetica') {
      const { parseDRE } = await import('@/lib/parsers/dre-parser');
      dadosMap.data = parseDRE(parsed.textItems);
    } else if (parsed.reportType === 'balancete') {
      const { parseBalancete } = await import('@/lib/parsers/balancete-parser');
      dadosMap.data = parseBalancete(parsed.textItems);
    }

    const { error } = await supabase.from('documentos').insert({
      empresa_id: empresaId,
      tipo: parsed.reportType,
      nome_arquivo: parsed.fileName,
      periodo: periodo,
      dados_parseados: dadosMap.data || {},
      user_id: user.id,
    });
    if (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento no banco de dados');
      return;
    }
    setRefreshKey(k => k + 1);
  }, []);

  const handleFileSelected = useCallback(async (category: CategoryKey, file: File) => {
    setCategories(prev => ({ ...prev, [category]: { status: 'processing', fileName: file.name } }));

    const result = await parsePDF(file);

    if (result.status === 'error') {
      setCategories(prev => ({ ...prev, [category]: { status: 'error', fileName: file.name } }));
      toast.error(`Erro ao processar ${file.name}`);
      return;
    }

    if (category === 'dre' && result.reportType === 'desconhecido') {
      result.reportType = 'dre-detalhada';
      result.reportTypeLabel = 'DRE Detalhada';
    }

    // Validate type matches category
    const expectedTypes = CATEGORY_TYPES[category];
    if (!expectedTypes.includes(result.reportType) && result.reportType !== 'desconhecido') {
      toast.warning(`O documento "${file.name}" foi identificado como ${result.reportTypeLabel}, não como ${category === 'balanco' ? 'Balanço' : category === 'dre' ? 'DRE' : 'Balancete'}. Importado mesmo assim.`);
    }

    setCategories(prev => ({ ...prev, [category]: { status: 'done', fileName: file.name, parsed: result } }));

    // Auto-detect empresa if none selected
    let empresa = selectedEmpresa;
    if (!empresa && (result.cnpj || result.empresa)) {
      empresa = await findOrCreateEmpresa(result.cnpj || '', result.empresa || '');
      if (empresa) setSelectedEmpresa(empresa);
    }

    // Save to database
    if (empresa) {
      await saveDocumento(empresa.id, result, periodoFormatado);
    }

    toast.success(`${file.name} processado com sucesso!`);
  }, [selectedEmpresa, findOrCreateEmpresa, saveDocumento]);

  const handleGenerateDashboard = () => {
    const allParsed: ParsedPDF[] = Object.values(categories)
      .filter(c => c.parsed)
      .map(c => c.parsed!);
    // Only setFiles if there are new parsed files (not loaded from DB)
    if (allParsed.length > 0) {
      setFiles(allParsed);
    }
    navigate('/dashboard');
  };

  const handleLoadDocumento = (doc: any) => {
    const cat = getDocumentGroup(doc.tipo) as CategoryKey;
    
    const pseudoParsed: ParsedPDF = {
      fileName: doc.nome_arquivo,
      reportType: doc.tipo,
      reportTypeLabel: doc.tipo,
      rawText: '',
      textItems: [],
      status: 'done',
      periodo: doc.periodo,
    };

    setCategories(prev => ({
      ...prev,
      [cat]: { status: 'done', fileName: doc.nome_arquivo, parsed: pseudoParsed },
    }));

    if (cat === 'balanco') {
      useContabilStore.setState({ balanco: doc.dados_parseados });
    } else if (cat === 'dre') {
      useContabilStore.setState({ dre: doc.dados_parseados });
    } else if (cat === 'balancete') {
      useContabilStore.setState({ balancete: doc.dados_parseados });
    }

    toast.success(`${doc.nome_arquivo} carregado do histórico`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header empresa={selectedEmpresa?.nome || storeEmpresa || undefined} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center animate-fade-slide-up">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Importar Relatórios Contábeis
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecione a empresa e faça upload dos PDFs em cada categoria
          </p>
        </div>

        {/* Empresa Selector */}
        <div className="animate-fade-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
          <EmpresaSelector selectedEmpresa={selectedEmpresa} onSelect={setSelectedEmpresa} />
        </div>

        {/* Periodo Selector */}
        <div className="animate-fade-slide-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
          <PeriodoSelector mes={periodoMes} ano={periodoAno} onChange={(m, a) => { setPeriodoMes(m); setPeriodoAno(a); }} />
        </div>

        {/* Loading indicator */}
        {loadingEmpresa && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando documentos da empresa...
          </div>
        )}

        {/* Category Drop Zones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <CategoryDropZone
            title="Balanço Patrimonial"
            description="Ativo, Passivo e PL"
            acceptedTypes={['balanco']}
            onFileSelected={(f) => handleFileSelected('balanco', f)}
            status={categories.balanco.status}
            fileName={categories.balanco.fileName}
            disabled={isProcessing || loadingEmpresa}
          />
          <CategoryDropZone
            title="DRE"
            description="Detalhada ou Sintética"
            acceptedTypes={['dre-detalhada', 'dre-sintetica']}
            onFileSelected={(f) => handleFileSelected('dre', f)}
            status={categories.dre.status}
            fileName={categories.dre.fileName}
            disabled={isProcessing || loadingEmpresa}
          />
          <CategoryDropZone
            title="Balancete"
            description="Saldos por conta"
            acceptedTypes={['balancete']}
            onFileSelected={(f) => handleFileSelected('balancete', f)}
            status={categories.balancete.status}
            fileName={categories.balancete.fileName}
            disabled={isProcessing || loadingEmpresa}
          />
        </div>

        {/* Document History */}
        <DocumentHistory
          empresaId={selectedEmpresa?.id || null}
          onLoadDocumento={handleLoadDocumento}
          refreshKey={refreshKey}
        />

        {/* Generate Dashboard */}
        {hasData && !loadingEmpresa && (
          <div className="flex justify-center animate-fade-slide-up">
            <Button size="lg" className="gap-2 font-heading font-semibold text-base px-8" onClick={handleGenerateDashboard}>
              <BarChart3 className="w-5 h-5" />
              {Object.values(categories).some(c => c.parsed) ? 'Gerar Dashboard' : 'Ver Dashboard'}
            </Button>
          </div>
        )}

        <div className="flex justify-center pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs text-muted-foreground"
            onClick={() => {
              useContabilStore.getState().loadSampleData();
              toast.success('Dados de exemplo carregados!');
              navigate('/dashboard');
            }}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Carregar dados de exemplo
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
