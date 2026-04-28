import { useState } from 'react';

import { useContabilStore } from '@/stores/useContabilStore';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scale, FileText, BookOpen, ArrowLeft, Download, RefreshCw, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { exportarPDF } from '@/lib/export-pdf';
import VisaoGeral from '@/components/dashboard/VisaoGeral';
import BalancoTab from '@/components/dashboard/BalancoTab';
import DRETab from '@/components/dashboard/DRETab';
import BalanceteTab from '@/components/dashboard/BalanceteTab';
import HistoricoTab from '@/components/dashboard/HistoricoTab';

const tabs = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'balanco', label: 'Balanço', icon: Scale },
  { id: 'dre', label: 'DRE', icon: FileText },
  { id: 'balancete', label: 'Balancete', icon: BookOpen },
  { id: 'historico', label: 'Histórico', icon: History },
];

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [exporting, setExporting] = useState(false);
  const { empresa, cnpj, periodo, reset } = useContabilStore();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();


  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { balanco, dre, balancete } = useContabilStore.getState();
      await exportarPDF({ empresa: empresa || undefined, cnpj: cnpj || undefined, periodo: periodo || undefined }, balanco, dre, balancete);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleNovaAnalise = () => {
    reset();
    navigate('/');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'visao-geral': return <VisaoGeral />;
      case 'balanco': return <BalancoTab />;
      case 'dre': return <DRETab />;
      case 'balancete': return <BalanceteTab />;
      case 'historico': return <HistoricoTab />;
      default: return <VisaoGeral />;
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tabs.map((tab) => (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(tab.id)}
                      className={activeTab === tab.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}
                    >
                      <tab.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{tab.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Voltar</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-4 h-14 px-4">
            <SidebarTrigger />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="font-heading text-lg font-bold text-foreground leading-tight">
                  {empresa || 'Dashboard Contábil'}
                </h1>
                {cnpj && (
                  <p className="text-muted-foreground text-xs">
                    CNPJ: {cnpj} {periodo && `• ${periodo}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-1.5 text-xs">
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{exporting ? 'Gerando PDF...' : 'Exportar PDF'}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nova Análise</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Nova Análise</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza? Os dados atuais serão perdidos. Você precisará importar os PDFs novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleNovaAnalise}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div key={activeTab} className="animate-fade-slide-up">
            {renderTab()}
          </div>
        </main>
      </div>
    </>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardContent />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
