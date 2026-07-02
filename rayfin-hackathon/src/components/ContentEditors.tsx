import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import type {
  ContentBlockRecord,
  SiteSettingsRecord,
  TimelineMilestoneRecord,
} from '@/types/site';

const richTextHelpText =
  'Supports bold, bullet lists, numbered lists, colors, and links. Use the toolbar or type **bold**, - item, 1. item, {blue}color{/blue}, and [link text](https://example.com).';

const colorOptions = [
  { name: 'blue', token: '{blue}', closingToken: '{/blue}', buttonClassName: 'text-blue-700' },
  {
    name: 'green',
    token: '{green}',
    closingToken: '{/green}',
    buttonClassName: 'text-emerald-700',
  },
  {
    name: 'amber',
    token: '{amber}',
    closingToken: '{/amber}',
    buttonClassName: 'text-amber-700',
  },
  { name: 'rose', token: '{rose}', closingToken: '{/rose}', buttonClassName: 'text-rose-700' },
  {
    name: 'purple',
    token: '{purple}',
    closingToken: '{/purple}',
    buttonClassName: 'text-violet-700',
  },
  {
    name: 'slate',
    token: '{slate}',
    closingToken: '{/slate}',
    buttonClassName: 'text-slate-700',
  },
] as const;

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
        'rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur',
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

function applyWrappedSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  openingToken: string,
  closingToken: string,
  placeholder: string
) {
  const selectedText = value.slice(selectionStart, selectionEnd) || placeholder;
  const nextValue = [
    value.slice(0, selectionStart),
    openingToken,
    selectedText,
    closingToken,
    value.slice(selectionEnd),
  ].join('');

  return {
    nextValue,
    nextSelectionStart: selectionStart + openingToken.length,
    nextSelectionEnd: selectionStart + openingToken.length + selectedText.length,
  };
}

function applyLinePrefix(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  getPrefix: (lineIndex: number) => string
) {
  const blockStart = value.lastIndexOf('\n', Math.max(selectionStart - 1, 0)) + 1;
  const rawBlockEnd = value.indexOf('\n', selectionEnd);
  const blockEnd = rawBlockEnd === -1 ? value.length : rawBlockEnd;
  const selectedBlock = value.slice(blockStart, blockEnd);
  const nextBlock = selectedBlock
    .split('\n')
    .map((line, lineIndex) => `${getPrefix(lineIndex)}${line}`)
    .join('\n');
  const nextValue = `${value.slice(0, blockStart)}${nextBlock}${value.slice(blockEnd)}`;

  return {
    nextValue,
    nextSelectionStart: blockStart,
    nextSelectionEnd: blockStart + nextBlock.length,
  };
}

function RichTextTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toolbarButtons = useMemo(
    () => [
      {
        label: 'Bold',
        onApply: (currentValue: string, selectionStart: number, selectionEnd: number) =>
          applyWrappedSelection(
            currentValue,
            selectionStart,
            selectionEnd,
            '**',
            '**',
            'bold text'
          ),
      },
      {
        label: 'Bullets',
        onApply: (currentValue: string, selectionStart: number, selectionEnd: number) =>
          applyLinePrefix(currentValue, selectionStart, selectionEnd, () => '- '),
      },
      {
        label: 'Numbers',
        onApply: (currentValue: string, selectionStart: number, selectionEnd: number) =>
          applyLinePrefix(currentValue, selectionStart, selectionEnd, (lineIndex) => `${lineIndex + 1}. `),
      },
      {
        label: 'Link',
        onApply: (currentValue: string, selectionStart: number, selectionEnd: number) =>
          applyWrappedSelection(
            currentValue,
            selectionStart,
            selectionEnd,
            '[',
            '](https://example.com)',
            'link text'
          ),
      },
    ],
    []
  );

  const applyTextChange = (
    mutate: (currentValue: string, selectionStart: number, selectionEnd: number) => {
      nextValue: string;
      nextSelectionStart: number;
      nextSelectionEnd: number;
    }
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const { nextValue, nextSelectionStart, nextSelectionEnd } = mutate(
      value,
      textarea.selectionStart,
      textarea.selectionEnd
    );

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  };

  const buttonClassName =
    'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="rounded-[1.5rem] border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-3 py-3">
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTextChange(button.onApply)}
              className={buttonClassName}
            >
              {button.label}
            </button>
          ))}
          {colorOptions.map((color) => (
            <button
              key={color.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                applyTextChange((currentValue, selectionStart, selectionEnd) =>
                  applyWrappedSelection(
                    currentValue,
                    selectionStart,
                    selectionEnd,
                    color.token,
                    color.closingToken,
                    `${color.name} text`
                  )
                )
              }
              className={`${buttonClassName} ${color.buttonClassName}`}
            >
              {color.name}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[9rem] w-full resize-y rounded-b-[1.5rem] bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
        />
      </div>
      <span className="mt-2 block text-xs leading-5 text-slate-500">{richTextHelpText}</span>
    </label>
  );
}

export function FormField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>['rows'];
}) {
  const baseClassName =
    'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return multiline ? (
    <RichTextTextarea
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  ) : (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={baseClassName}
      />
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
  bodyLabel = 'Body',
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
          label="Description"
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
