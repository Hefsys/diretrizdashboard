import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  documentName: string;
}

const EmptyState = ({ documentName }: EmptyStateProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center animate-fade-slide-up">
      <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
        {documentName} não importado
      </h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Importe o {documentName} para visualizar esta seção. Volte à tela inicial e faça upload do PDF correspondente.
      </p>
    </div>
  );
};

export default EmptyState;
