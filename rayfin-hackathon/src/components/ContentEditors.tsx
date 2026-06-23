import { useEffect, useState, type ReactNode } from 'react';

import type {
  ContentBlockRecord,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

function InlineEditorPanel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'rounded-3xl border border-blue-200/70 bg-white/95 p-5 shadow-lg shadow-blue-950/5 backdrop-blur',
        className,
      ].join(' ')}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FormField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const baseClassName =
    'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${baseClassName} resize-y`}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={baseClassName}
        />
      )}
    </label>
  );
}

interface SiteSettingsInlineEditorProps {
  title: string;
  description?: string;
  settings: SiteSettingsRecord;
  fields: Array<{
    key: keyof SiteSettingsRecord;
    label: string;
    multiline?: boolean;
    placeholder?: string;
  }>;
  saving: boolean;
  onSave: (settings: SiteSettingsRecord) => Promise<void>;
  className?: string;
}

export function SiteSettingsInlineEditor({
  title,
  description,
  settings,
  fields,
  saving,
  onSave,
  className,
}: SiteSettingsInlineEditorProps) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const updateField = (key: keyof SiteSettingsRecord, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setMessage(null);

    try {
      await onSave(draft);
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    }
  };

  return (
    <InlineEditorPanel title={title} description={description} className={className}>
      <div className="space-y-4">
        {fields.map((field) => (
          <FormField
            key={String(field.key)}
            label={field.label}
            value={String(draft[field.key] ?? '')}
            multiline={field.multiline}
            placeholder={field.placeholder}
            onChange={(value) => updateField(field.key, value)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save section
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </InlineEditorPanel>
  );
}

interface ContentBlockInlineEditorProps {
  title: string;
  description?: string;
  block: ContentBlockRecord;
  saving: boolean;
  canDelete: boolean;
  onSave: (block: ContentBlockRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  deleteLabel?: string;
  showImageField?: boolean;
  showCallToActionFields?: boolean;
  bodyLabel?: string;
  bodyPlaceholder?: string;
  className?: string;
}

export function ContentBlockInlineEditor({
  title,
  description,
  block,
  saving,
  canDelete,
  onSave,
  onDelete,
  deleteLabel = 'Delete item',
  showImageField = false,
  showCallToActionFields = false,
  bodyLabel = 'Body (supports [link text](https://example.com))',
  bodyPlaceholder,
  className,
}: ContentBlockInlineEditorProps) {
  const [draft, setDraft] = useState(block);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(block);
  }, [block]);

  const handleSave = async () => {
    setMessage(null);
    setError(null);

    try {
      await onSave(draft);
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save content.');
    }
  };

  const handleDelete = async () => {
    setMessage(null);
    setError(null);

    try {
      await onDelete(block.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete content.');
    }
  };

  return (
    <InlineEditorPanel title={title} description={description} className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Title"
          value={draft.title}
          onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
        />
        <FormField
          label="Sort order"
          value={String(draft.sortOrder)}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              sortOrder: Number.parseInt(value, 10) || 0,
            }))
          }
        />
      </div>

      <div className="mt-4 space-y-4">
        <FormField
          label={bodyLabel}
          value={draft.body}
          multiline={true}
          placeholder={bodyPlaceholder}
          onChange={(value) => setDraft((current) => ({ ...current, body: value }))}
        />

        {showImageField ? (
          <FormField
            label="Image URL"
            value={draft.imageUrl ?? ''}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                imageUrl: value.trim() ? value : undefined,
              }))
            }
          />
        ) : null}

        {showCallToActionFields ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="CTA label"
              value={draft.ctaLabel ?? ''}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  ctaLabel: value.trim() ? value : undefined,
                }))
              }
            />
            <FormField
              label="CTA URL"
              value={draft.ctaUrl ?? ''}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  ctaUrl: value.trim() ? value : undefined,
                }))
              }
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save item
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={saving}
            className="rounded-full border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteLabel}
          </button>
        ) : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </InlineEditorPanel>
  );
}

interface TimelineMilestoneInlineEditorProps {
  title: string;
  description?: string;
  item: TimelineMilestoneRecord;
  saving: boolean;
  canDelete: boolean;
  onSave: (item: TimelineMilestoneRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

export function TimelineMilestoneInlineEditor({
  title,
  description,
  item,
  saving,
  canDelete,
  onSave,
  onDelete,
  className,
}: TimelineMilestoneInlineEditorProps) {
  const [draft, setDraft] = useState(item);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const handleSave = async () => {
    setMessage(null);
    setError(null);

    try {
      await onSave(draft);
      setMessage('Saved.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save timeline milestone.'
      );
    }
  };

  const handleDelete = async () => {
    setMessage(null);
    setError(null);

    try {
      await onDelete(item.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete timeline milestone.'
      );
    }
  };

  return (
    <InlineEditorPanel title={title} description={description} className={className}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Date"
          value={draft.dateLabel}
          onChange={(value) => setDraft((current) => ({ ...current, dateLabel: value }))}
        />
        <FormField
          label="Milestone"
          value={draft.milestone}
          onChange={(value) => setDraft((current) => ({ ...current, milestone: value }))}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
        <FormField
          label="Description (supports [link text](https://example.com))"
          value={draft.description}
          multiline={true}
          onChange={(value) =>
            setDraft((current) => ({ ...current, description: value }))
          }
        />
        <FormField
          label="Sort order"
          value={String(draft.sortOrder)}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              sortOrder: Number.parseInt(value, 10) || 0,
            }))
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save milestone
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={saving}
            className="rounded-full border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete milestone
          </button>
        ) : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </InlineEditorPanel>
  );
}
