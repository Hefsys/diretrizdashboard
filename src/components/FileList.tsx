import { ParsedPDF } from '@/lib/pdf-parser';
import { FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileListProps {
  files: ParsedPDF[];
}

const statusConfig = {
  processing: { icon: Loader2, label: 'Processando...', className: 'text-primary animate-spin' },
  done: { icon: CheckCircle2, label: 'Concluído', className: 'text-accent' },
  error: { icon: AlertCircle, label: 'Erro', className: 'text-destructive' },
};

const FileList = ({ files }: FileListProps) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Arquivos carregados ({files.length})
      </h2>
      <div className="space-y-2">
        {files.map((file, i) => {
          const status = statusConfig[file.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={`${file.fileName}-${i}`}
              className="bg-card rounded-lg p-4 flex items-center gap-4 animate-fade-slide-up border border-border/50"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <div className="p-2 rounded-md bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate">{file.fileName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                    {file.reportTypeLabel}
                  </span>
                  {file.empresa && <span className="truncate">• {file.empresa}</span>}
                  {file.cnpj && <span className="hidden sm:inline">• {file.cnpj}</span>}
                </div>
                {file.error && (
                  <p className="text-destructive text-xs mt-1">{file.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm shrink-0">
                <StatusIcon className={`w-4 h-4 ${status.className}`} />
                <span className="text-muted-foreground hidden sm:inline">{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;
