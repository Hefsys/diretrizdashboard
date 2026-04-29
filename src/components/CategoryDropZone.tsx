import { useCallback, useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2, Eye } from 'lucide-react';
import { ReportType } from '@/lib/pdf-parser';
import { Button } from '@/components/ui/button';

interface CategoryDropZoneProps {
  title: string;
  description: string;
  acceptedTypes: ReportType[];
  onFileSelected: (file: File) => void;
  status: 'idle' | 'processing' | 'done' | 'error';
  fileName?: string;
  disabled?: boolean;
  onOpenPdf?: () => void;
}

const CategoryDropZone = ({
  title,
  description,
  onFileSelected,
  status,
  fileName,
  disabled,
  onOpenPdf,
}: CategoryDropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length) onFileSelected(files[0]);
  }, [onFileSelected, disabled]);

  const handleClick = () => {
    if (!disabled && status !== 'processing') inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFileSelected(files[0]);
    e.target.value = '';
  };

  const statusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'done':
        return <FileCheck className="w-8 h-8 text-accent" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      default:
        return <Upload className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        cursor-pointer rounded-lg p-6 flex flex-col items-center justify-center gap-3
        transition-all duration-300 min-h-[180px] border-2 border-dashed
        ${dragging ? 'border-primary bg-primary/10' : 'border-border/50'}
        ${status === 'done' ? 'border-accent/50 bg-accent/5' : ''}
        ${status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5'}
      `}
    >
      <div className={`p-3 rounded-full bg-card transition-transform duration-300 ${dragging ? 'scale-110' : ''}`}>
        {statusIcon()}
      </div>
      <div className="text-center">
        <p className="text-foreground font-heading text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs mt-1">{description}</p>
      </div>
      {fileName && (
        <p className="text-xs text-muted-foreground truncate max-w-full px-2">
          {fileName}
        </p>
      )}
      {status === 'done' && onOpenPdf && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPdf();
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          Ver PDF
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default CategoryDropZone;
