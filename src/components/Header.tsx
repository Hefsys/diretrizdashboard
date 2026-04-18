import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import logo from '@/assets/logo-diretriz-vertical.png';

interface HeaderProps {
  empresa?: string;
}

const Header = ({ empresa }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border bg-[hsl(235_58%_15%)] backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Diretriz Contabilidade" className="h-16" />
        </div>
        <div className="flex items-center gap-3">
          {empresa && (
            <span className="text-white/80 text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {empresa}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={handleLogout} title="Sair">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
