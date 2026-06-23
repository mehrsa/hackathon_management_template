import {
  ContentBlockInlineEditor,
  SiteSettingsInlineEditor,
} from '@/components/ContentEditors';
import { getBlocksForPage, isDefaultBlockId } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';

function renderBody(body: string) {
  return body.split('\n').map((paragraph) => (
    <p key={paragraph} className="text-sm leading-7 text-slate-600">
      {paragraph}
    </p>
  ));
}

export function SubmitPage() {
  const {
    isEditing,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const blocks = getBlocksForPage(siteData.blocks, 'submit');
  const nextSortOrder = useNextSortOrder(blocks);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-8 py-12 text-white shadow-xl">
        <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-blue-400/15 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          {siteData.settings.navSubmitLabel}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          {siteData.settings.submitHeroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
          {siteData.settings.submitIntro}
        </p>

        {isEditing ? (
          <div className="mt-8 max-w-3xl">
            <SiteSettingsInlineEditor
              title="Edit page introduction"
              description="Update the opening submission guidance directly in context."
              settings={siteData.settings}
              saving={saving}
              onSave={saveSettings}
              fields={[
                {
                  key: 'navSubmitLabel',
                  label: 'Menu and page label',
                },
                {
                  key: 'submitHeroTitle',
                  label: 'Hero title',
                  multiline: true,
                },
                {
                  key: 'submitIntro',
                  label: 'Page introduction',
                  multiline: true,
                },
                {
                  key: 'submitChecklistEyebrow',
                  label: 'Checklist section eyebrow',
                },
                {
                  key: 'submitChecklistTitle',
                  label: 'Checklist section title',
                },
                {
                  key: 'submitReminderTitle',
                  label: 'Reminder section title',
                },
              ]}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              {siteData.settings.submitChecklistEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {siteData.settings.submitChecklistTitle}
            </h2>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={() =>
                void saveBlock({
                  id: crypto.randomUUID(),
                  pageKey: 'submit',
                  blockKind: 'submission',
                  title: 'New submission item',
                  body:
                    'Describe another required asset, deliverable, or judge access instruction.',
                  sortOrder: nextSortOrder,
                }).catch(() => undefined)
              }
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add checklist item
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {blocks.map((block) => (
            <article
              key={block.id}
              className="site-card rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-950">{block.title}</h2>
              <div className="mt-3 space-y-3">{renderBody(block.body)}</div>
              {block.ctaLabel && block.ctaUrl ? (
                <a
                  href={block.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {block.ctaLabel}
                </a>
              ) : null}

              {isEditing ? (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <ContentBlockInlineEditor
                    title="Edit checklist item"
                    block={block}
                    saving={saving}
                    onSave={saveBlock}
                    onDelete={removeBlock}
                    canDelete={!isDefaultBlockId(block.id)}
                    deleteLabel="Delete checklist item"
                    showCallToActionFields={true}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-blue-950 shadow-sm">
        <h2 className="text-xl font-semibold">{siteData.settings.submitReminderTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-900/85">
          Submissions that clearly describe the problem, provide a reliable demo path,
          and show where Rayfin powers the experience will be easier for judges to score well.
        </p>
      </section>

    </div>
  );
}
