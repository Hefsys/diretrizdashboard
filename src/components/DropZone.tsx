import { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const DropZone = ({ onFilesSelected, disabled }: DropZoneProps) => {
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
    if (files.length) onFilesSelected(files);
  }, [onFilesSelected, disabled]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFilesSelected(files);
    e.target.value = '';
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        drop-zone-border cursor-pointer rounded-lg p-12 flex flex-col items-center justify-center gap-4
        transition-all duration-300 min-h-[240px]
        ${dragging ? 'dragging' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
      `}
    >
      <div className={`p-4 rounded-full bg-primary/10 transition-transform duration-300 ${dragging ? 'scale-110' : ''}`}>
        <Upload className="w-10 h-10 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-heading text-lg font-semibold">
          Arraste seus PDFs aqui ou clique para selecionar
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Suporte a Balanço, Balancete, DRE Detalhada e DRE Sintética
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default DropZone;
