import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, Loader2 } from 'lucide-react';
import logo from '@/assets/logo-diretriz.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email ou senha inválidos.');
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={logo} alt="Diretriz Contabilidade" className="h-36 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-foreground">Acessar sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10"
              required
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Acesso restrito. Contate o administrador para obter credenciais.
        </p>
      </div>
    </div>
  );
};

export default Auth;
