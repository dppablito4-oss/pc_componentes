'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { byId, searchConcepts } from '@/lib/manifest';
import { hueOfSystem, hueStyle } from '@/lib/palette';
import { categoryEs, levelNameEs, partNameEs } from '@/lib/locale-es';

/** What the palette offers before anything has been typed. */
const suggested = [
  'package',
  'gddr7',
  'gpc',
  'sm',
  'tensor',
  'rt',
  'l2',
  'vrm',
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="search-dialog">
        <DialogTitle>Buscar un componente</DialogTitle>
        <DialogDescription>
          Abre cualquier pieza física o diagrama de arquitectura.
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder="Prueba con memoria, GDDR7, L2 o SM…"
          />
          <CommandList>
            <CommandEmpty>
              No encontramos componentes. Prueba con «memoria» o «CUDA».
            </CommandEmpty>
            <CommandGroup
              heading={query ? 'Resultados' : 'Componentes sugeridos'}
            >
              {(query
                ? searchConcepts(query)
                : suggested.map((id) => byId[id])
              ).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  style={hueStyle(hueOfSystem(c.category))}
                  onSelect={() => onSelect(c.id)}
                >
                  <i />
                  <div>
                    {partNameEs(c)}
                    <span className="part-english" lang="en">
                      {c.name}
                    </span>
                    <small>
                      <span>{levelNameEs(c.level)}</span>
                      <em>
                        <b>{categoryEs[c.category]}</b> ·{' '}
                        {c.representationType === 'logical'
                          ? 'Arquitectura lógica'
                          : 'Componente físico'}
                      </em>
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="search-hint">
          ↑ ↓ Navegar <span>Intro para inspeccionar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
