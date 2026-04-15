import { useContabilStore } from '@/stores/useContabilStore';
import KPICards from './KPICards';
import KPICardsExtras from './KPICardsExtras';
import ComposicaoReceita from './ComposicaoReceita';
import ComposicaoAtivo from './ComposicaoAtivo';
import DespesasChart from './DespesasChart';
import EstruturaCapital from './EstruturaCapital';
import LucratividadeDonut from './LucratividadeDonut';
import ComparacaoGastos from './ComparacaoGastos';
import EmptyState from './EmptyState';

const VisaoGeral = () => {
  const { dre, balanco } = useContabilStore();
  const hasAny = dre || balanco;

  if (!hasAny) {
    return <EmptyState documentName="relatórios contábeis" />;
  }

  return (
    <div className="space-y-6">
      <div data-pdf-section="kpis">
        <KPICards />
      </div>

      <KPICardsExtras />

      {dre && (
        <div data-pdf-section="lucratividade" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LucratividadeDonut
            title="Margem Bruta"
            subtitle="Lucro Bruto / Receita Líquida"
            value={dre.lucroBruto}
            total={dre.receitaLiquida}
            color="#f59e0b"
          />
          <LucratividadeDonut
            title="Margem Operacional"
            subtitle="Resultado Op. / Receita Líquida"
            value={dre.resultadoOperacional}
            total={dre.receitaLiquida}
            color="#06b6d4"
          />
          <LucratividadeDonut
            title="Margem Líquida"
            subtitle="Lucro Líquido / Receita Bruta"
            value={dre.lucroLiquido}
            total={dre.receitaBruta}
            color="#10b981"
          />
        </div>
      )}

      <div data-pdf-section="graficos-1" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dre ? <ComposicaoReceita /> : <EmptyState documentName="DRE" />}
        {balanco ? <ComposicaoAtivo /> : <EmptyState documentName="Balanço Patrimonial" />}
      </div>

      <div data-pdf-section="graficos-2" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dre ? <DespesasChart /> : <EmptyState documentName="DRE" />}
        {balanco ? <EstruturaCapital /> : <EmptyState documentName="Balanço Patrimonial" />}
      </div>

      {dre && (
        <div data-pdf-section="gastos">
          <ComparacaoGastos />
        </div>
      )}
    </div>
  );
};

export default VisaoGeral;
