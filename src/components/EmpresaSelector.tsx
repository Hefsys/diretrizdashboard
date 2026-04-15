import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
}

interface EmpresaSelectorProps {
  selectedEmpresa: Empresa | null;
  onSelect: (empresa: Empresa) => void;
}

const EmpresaSelector = ({ selectedEmpresa, onSelect }: EmpresaSelectorProps) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCnpj, setNovoCnpj] = useState('');

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('empresas').select('*').order('nome');
    if (data) setEmpresas(data);
  };

  const filtered = empresas.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.cnpj && e.cnpj.includes(search))
  );

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('empresas')
      .insert({ nome: novoNome.trim(), cnpj: novoCnpj.trim() || null, user_id: user.id })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') toast.error('CNPJ já cadastrado');
      else toast.error('Erro ao cadastrar empresa');
      return;
    }
    if (data) {
      onSelect(data);
      setEmpresas(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setDialogOpen(false);
      setNovoNome('');
      setNovoCnpj('');
      toast.success('Empresa cadastrada!');
    }
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setShowList(!showList)}
      >
        <Building2 className="w-5 h-5 text-primary shrink-0" />
        {selectedEmpresa ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedEmpresa.nome}</p>
            {selectedEmpresa.cnpj && (
              <p className="text-xs text-muted-foreground">{selectedEmpresa.cnpj}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex-1">Selecionar empresa...</p>
        )}
      </div>

      {showList && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl max-h-[300px] overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            {filtered.map(empresa => (
              <div
                key={empresa.id}
                className="px-3 py-2 hover:bg-primary/10 cursor-pointer transition-colors"
                onClick={() => { onSelect(empresa); setShowList(false); setSearch(''); }}
              >
                <p className="text-sm font-medium text-foreground">{empresa.nome}</p>
                {empresa.cnpj && <p className="text-xs text-muted-foreground">{empresa.cnpj}</p>}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma empresa encontrada</p>
            )}
          </div>
          <div className="p-2 border-t border-border">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar nova empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">Nova Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome *</label>
                    <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Razão social" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">CNPJ</label>
                    <Input value={novoCnpj} onChange={e => setNovoCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                  </div>
                  <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {showList && <div className="fixed inset-0 z-40" onClick={() => { setShowList(false); setSearch(''); }} />}
    </div>
  );
};

export default EmpresaSelector;
