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
  const criteria = blocks.filter((block) => block.blockKind === 'criterion');
  const rewardsBlock = blocks.find((block) => block.blockKind === 'reward') ?? null;
  const nextSortOrder = useNextSortOrder(criteria);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-8 py-9 text-white shadow-xl md:px-10 md:py-10">
        <div className="absolute -right-8 top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
          {siteData.settings.navJudgingLabel}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl lg:text-[2.7rem]">
          {siteData.settings.judgingHeroTitle}
        </h1>
        <RichTextBody
          body={siteData.settings.judgingIntro}
          className="mt-4 max-w-3xl space-y-3"
          paragraphClassName="text-[1.02rem] leading-8 text-slate-100"
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
                  label: 'Page introduction',
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
          {criteria.map((block, index) => (
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

      {rewardsBlock ? (
        <section className="rounded-[2rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-7 text-slate-950 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Celebration
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {rewardsBlock.title}
            </h2>
            <RichTextBody
              body={rewardsBlock.body}
              className="mt-4 max-w-3xl space-y-3"
              paragraphClassName="text-base leading-8 text-slate-700"
            />

            {isEditing ? (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <ContentBlockInlineEditor
                  title="Edit rewards section"
                  description="Update the single rewards and celebration block shown on this page."
                  block={rewardsBlock}
                  saving={saving}
                  onSave={saveBlock}
                  onDelete={removeBlock}
                  canDelete={false}
                  deleteLabel="Delete rewards section"
                  bodyPlaceholder="Explain rewards, recognition, or celebration plans with lists, bold callouts, or supporting links."
                />
              </div>
            ) : null}
          </article>
        </section>
      ) : null}
    </div>
  );
}
