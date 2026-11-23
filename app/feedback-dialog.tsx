'use client';
import { useState, type SubmitEvent } from 'react';
import { ArrowUpRight, LoaderCircle, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CONTACT_ENDPOINT, GITHUB_PAGES, NEW_ISSUE } from './links';
import {
  EMPTY_DRAFT,
  KIND_LABELS,
  KINDS,
  LIMITS,
  payload,
  send,
  type Context,
  type Draft,
  type Kind,
  type Outcome,
} from './feedback';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read at the moment of sending, so it is what the reader sees then. */
  context: () => Context;
};

type Status = 'idle' | 'sending' | Outcome;

const PROBLEMS: Partial<Record<Status, string>> = {
  invalid:
    'Revisa que el mensaje tenga entre 10 y 5000 caracteres y que el correo esté completo.',
  rate_limited:
    'Has enviado varios mensajes en poco tiempo. Inténtalo de nuevo en unos minutos.',
  failed:
    'No se pudo enviar el mensaje. Revisa tu conexión y vuelve a intentarlo. Tu texto sigue aquí.',
};

/**
 * A message to the maintainer. The form posts to `api/contact.ts`, which holds
 * the mail credentials; nothing here knows where the message ends up.
 *
 * The dialog stays mounted once opened, so the draft survives closing it.
 * Only a sent message clears it.
 */
export default function FeedbackDialog({ open, onOpenChange, context }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>('idle');
  const [replyTo, setReplyTo] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const change = (next: boolean) => {
    if (!next && status === 'sent') {
      setDraft(EMPTY_DRAFT);
      setStatus('idle');
    } else if (!next && status !== 'sending') {
      setStatus('idle');
    }
    onOpenChange(next);
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    const outcome = await send(CONTACT_ENDPOINT, payload(draft, context()));
    if (outcome === 'sent') {
      setReplyTo(draft.email.trim() !== '');
      setDraft(EMPTY_DRAFT);
    }
    setStatus(outcome);
  };

  const length = draft.message.trim().length;
  const problem = PROBLEMS[status];

  return (
    <Dialog open={open} onOpenChange={change} modal>
      <DialogContent className="about-dialog feedback-dialog">
        <DialogTitle>Enviar comentarios</DialogTitle>
        <DialogDescription>
          {GITHUB_PAGES
            ? 'Comparte una sugerencia o reporta un problema en el repositorio de GitHub.'
            : 'Cuéntanos si encontraste un error, tienes una idea o quieres colaborar en PC Anatomy.'}
        </DialogDescription>
        {GITHUB_PAGES ? (
          <a
            className="feedback-submit"
            href={NEW_ISSUE}
            target="_blank"
            rel="noreferrer"
          >
            Abrir un reporte en GitHub
            <ArrowUpRight size={15} />
          </a>
        ) : status === 'sent' ? (
          <div className="feedback-done">
            <output>
              Gracias, enviamos tu mensaje.
              {replyTo && ' Te responderemos al correo indicado.'}
            </output>
            <button
              type="button"
              className="feedback-submit"
              onClick={() => setStatus('idle')}
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : status === 'unavailable' ? (
          <div className="feedback-done" role="alert">
            <p>
              Puedes abrir un reporte en GitHub. Tu texto se conserva aquí para
              que puedas copiarlo.
            </p>
            <a
              className="feedback-submit"
              href={NEW_ISSUE}
              target="_blank"
              rel="noreferrer"
            >
              Abrir un reporte en GitHub
              <ArrowUpRight size={15} />
            </a>
            <button
              type="button"
              className="feedback-back"
              onClick={() => setStatus('idle')}
            >
              Volver al formulario
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={submit}>
            <fieldset className="feedback-kinds">
              <legend>¿De qué se trata?</legend>
              {KINDS.map((kind) => (
                <label key={kind}>
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    checked={draft.kind === kind}
                    onChange={() => set('kind', kind as Kind)}
                  />
                  <span>{KIND_LABELS[kind]}</span>
                </label>
              ))}
            </fieldset>
            <div className="feedback-row">
              <label>
                <span>
                  Nombre <small>opcional</small>
                </span>
                <input
                  name="name"
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  maxLength={LIMITS.name}
                  autoComplete="name"
                />
              </label>
              <label>
                <span>
                  Correo <small>opcional, para responderte</small>
                </span>
                <input
                  name="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                  maxLength={LIMITS.email}
                  autoComplete="email"
                />
              </label>
            </div>
            <div className="feedback-message">
              <label>
                <span>Mensaje</span>
                <textarea
                  name="message"
                  value={draft.message}
                  onChange={(e) => set('message', e.target.value)}
                  required
                  minLength={LIMITS.messageMin}
                  maxLength={LIMITS.messageMax}
                  rows={5}
                  aria-describedby="feedback-count"
                />
              </label>
              <small id="feedback-count" className="feedback-count">
                {length < LIMITS.messageMin
                  ? `Al menos ${LIMITS.messageMin} caracteres`
                  : `${length} / ${LIMITS.messageMax}`}
              </small>
            </div>
            {/* Off screen and out of the tab order: people never see it, bots
                fill it in, and the server drops anything that has it set. */}
            <div className="feedback-trap" aria-hidden="true">
              <label>
                Website
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={draft.website}
                  onChange={(e) => set('website', e.target.value)}
                />
              </label>
            </div>
            <p className="feedback-note">
              El mensaje incluye la dirección de esta página, tu selección y el
              idioma de la interfaz. Lo recibe el equipo de PC Anatomy para
              poder responderte.
            </p>
            {problem && (
              <p className="feedback-error" role="alert">
                {problem}
              </p>
            )}
            <button
              className="feedback-submit"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <LoaderCircle size={15} className="feedback-spin" />
              ) : (
                <Send size={15} />
              )}
              {status === 'sending' ? 'Enviando…' : 'Enviar'}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
