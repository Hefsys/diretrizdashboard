import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays } from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 8 }, (_, i) => String(currentYear - 4 + i));

interface PeriodoSelectorProps {
  mes: string;
  ano: string;
  onChange: (mes: string, ano: string) => void;
}

const PeriodoSelector = ({ mes, ano, onChange }: PeriodoSelectorProps) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <CalendarDays className="w-5 h-5 text-primary shrink-0" />
      <span className="text-sm font-medium text-foreground whitespace-nowrap">Período:</span>
      <div className="flex gap-2 flex-1">
        <Select value={mes} onValueChange={(v) => onChange(v, ano)}>
          <SelectTrigger className="h-8 text-sm flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={(v) => onChange(mes, v)}>
          <SelectTrigger className="h-8 text-sm w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANOS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PeriodoSelector;
