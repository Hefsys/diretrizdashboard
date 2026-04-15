import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Plus, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  created_at: string;
  docCount?: number;
  lastPeriodo?: string;
}

const Empresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const { data: empresasData, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;

      // Get doc counts per empresa
      const { data: docs } = await supabase
        .from('documentos')
        .select('empresa_id, periodo, created_at')
        .order('created_at', { ascending: false });

      const enriched = (empresasData || []).map((emp) => {
        const empDocs = (docs || []).filter((d) => d.empresa_id === emp.id);
        return {
          ...emp,
          docCount: empDocs.length,
          lastPeriodo: empDocs[0]?.periodo || undefined,
        };
      });

      setEmpresas(enriched);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const filtered = empresas.filter((e) => {
    const q = search.toLowerCase();
    return e.nome.toLowerCase().includes(q) || (e.cnpj && e.cnpj.includes(q));
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Empresas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das empresas do escritório
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/importar')}>
            <Plus className="w-4 h-4" />
            Importar Documentos
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{empresas.length}</p>
            <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {empresas.reduce((acc, e) => acc + (e.docCount || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Documentos importados</p>
          </Card>
          <Card className="p-4 text-center hidden md:block">
            <p className="text-2xl font-bold text-foreground">
              {empresas.filter((e) => (e.docCount || 0) > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Com documentos</p>
          </Card>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-muted-foreground py-12">Carregando...</div>
        )}

        {/* Empty state */}
        {!loading && empresas.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma empresa cadastrada
            </h2>
            <p className="text-muted-foreground mb-6">
              Importe o primeiro documento PDF para criar uma empresa automaticamente.
            </p>
            <Button onClick={() => navigate('/importar')} className="gap-2">
              <Plus className="w-4 h-4" />
              Importar Documentos
            </Button>
          </Card>
        )}

        {/* Empresa list */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-3">
            {filtered.map((emp) => (
              <Card
                key={emp.id}
                className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/importar?empresa=${emp.id}`)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{emp.nome}</p>
                    {emp.cnpj && (
                      <p className="text-xs text-muted-foreground">{emp.cnpj}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {emp.lastPeriodo && (
                    <Badge variant="secondary" className="text-xs">
                      {emp.lastPeriodo}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    {emp.docCount || 0}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && empresas.length > 0 && (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma empresa encontrada para "{search}"
          </div>
        )}
      </main>
    </div>
  );
};

export default Empresas;
