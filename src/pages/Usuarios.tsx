import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Trash2, Loader2, Mail, Lock, ArrowLeft, Users } from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
}

const Usuarios = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/auth'); return; }

    const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!data) {
      toast.error('Acesso restrito a administradores');
      navigate('/');
      return;
    }
    setIsAdmin(true);
    loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'create', email, password },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success(`Usuário ${email} criado com sucesso!`);
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Excluir o usuário ${userEmail}?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success(`Usuário ${userEmail} excluído`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir usuário');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-7 h-7" />
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mt-1">Adicione ou remova usuários do sistema</p>
          </div>
        </div>

        {/* Create user form */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Novo Usuário
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Criar Usuário
            </Button>
          </form>
        </Card>

        {/* User list */}
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Usuários cadastrados
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Carregando...
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
          ) : (
            users.map((u) => (
              <Card key={u.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(u.id, u.email || '')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Usuarios;
