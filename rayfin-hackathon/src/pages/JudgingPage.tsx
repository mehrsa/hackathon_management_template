import {
  ContentBlockInlineEditor,
  SiteSettingsInlineEditor,
} from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage, isDefaultBlockId } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';

export function JudgingPage() {
  const {
    isEditing,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const blocks = getBlocksForPage(siteData.blocks, 'judging');
  const nextSortOrder = useNextSortOrder(blocks);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-8 py-12 text-white shadow-xl">
        <div className="absolute -right-8 top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          {siteData.settings.navJudgingLabel}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          {siteData.settings.judgingHeroTitle}
        </h1>
        <RichTextBody
          body={siteData.settings.judgingIntro}
          className="mt-4 max-w-3xl space-y-3"
          paragraphClassName="text-base leading-8 text-slate-100"
        />

        {isEditing ? (
          <div className="mt-8 max-w-3xl">
            <SiteSettingsInlineEditor
              title="Edit page introduction"
              description="Update the opening judging guidance without leaving the page."
              settings={siteData.settings}
              saving={saving}
              onSave={saveSettings}
              fields={[
                {
                  key: 'navJudgingLabel',
                  label: 'Menu and page label',
                },
                {
                  key: 'judgingHeroTitle',
                  label: 'Hero title',
                  multiline: true,
                },
                {
                  key: 'judgingIntro',
                  label: 'Page introduction (supports [link text](https://example.com))',
                  multiline: true,
                },
                {
                  key: 'judgingCriteriaEyebrow',
                  label: 'Criteria section eyebrow',
                },
                {
                  key: 'judgingCriteriaTitle',
                  label: 'Criteria section title',
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
              {siteData.settings.judgingCriteriaEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {siteData.settings.judgingCriteriaTitle}
            </h2>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={() =>
                void saveBlock({
                  id: crypto.randomUUID(),
                  pageKey: 'judging',
                  blockKind: 'criterion',
                  title: 'New judging criterion',
                  body: 'Explain how judges should interpret and score this area.',
                  sortOrder: nextSortOrder,
                }).catch(() => undefined)
              }
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add criterion
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {blocks.map((block, index) => (
            <article
              key={block.id}
              className="site-card rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {index + 1}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">{block.title}</h2>
              <RichTextBody body={block.body} className="mt-3 space-y-3" />

              {isEditing ? (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <ContentBlockInlineEditor
                    title={`Edit criterion ${index + 1}`}
                    block={block}
                    saving={saving}
                    onSave={saveBlock}
                    onDelete={removeBlock}
                    canDelete={!isDefaultBlockId(block.id)}
                    deleteLabel="Delete criterion"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
