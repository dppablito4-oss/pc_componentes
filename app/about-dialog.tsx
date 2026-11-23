'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import { GUIDE, GUIDE_ACCELERATION, REPOSITORY } from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>Del gabinete a un núcleo de cómputo</DialogTitle>
        <DialogDescription>
          PC Anatomy es un visor 3D gratuito e interactivo. Descubre cómo
          funciona una PC de escritorio al inspeccionar y desmontar sus
          componentes.
        </DialogDescription>
        <p>
          Comienza con una torre ATX montada. Entra en la placa base, la tarjeta
          gráfica o el procesador GB202 hasta llegar a un multiprocesador de
          flujo.
        </p>
        <h3>Modelos físicos y lógicos</h3>
        <p>
          <strong>Hardware.</strong> Los modelos representan de forma aproximada
          la geometría física. El contorno ATX, la separación de las ranuras y
          la abertura trasera siguen las dimensiones publicadas.
        </p>
        <p>
          <strong>Silicio.</strong> Los diagramas muestran la arquitectura
          lógica documentada. El GB202 completo tiene 192 SM. La RTX 5090 activa
          170.
        </p>
        <h3>Investigación y créditos</h3>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          Configurar la aceleración gráfica del navegador{' '}
          <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          Guía ilustrada de componentes de PC
          <ArrowUpRight size={15} />
        </a>
        {Object.entries(sources)
          .slice(0, 2)
          .map(([id, s]) => (
            <a
              className="about-source"
              key={id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        <a
          className="about-source"
          href="https://github.com/ashemag/human-atlas"
          target="_blank"
          rel="noreferrer"
        >
          Referencia de interacción · Human Atlas
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          Código fuente original de PC Anatomy
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">
          Proyecto independiente de NVIDIA, AMD e Intel. Investigación revisada
          en septiembre de 2026.
        </p>
      </DialogContent>
    </Dialog>
  );
}
