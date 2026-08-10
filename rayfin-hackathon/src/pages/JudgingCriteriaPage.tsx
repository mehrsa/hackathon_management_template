import { ContentBlockInlineEditor, SiteSettingsInlineEditor } from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { MAX_CRITERION_SCORE, MIN_CRITERION_SCORE } from '@/types/judging';

export function JudgingCriteriaPage() {
  const { isEditing, siteData, saving, saveSettings, saveBlock, removeBlock } =
    useSitePageContext();
  const blocks = getBlocksForPage(siteData.blocks, 'judging');
  const criteria = blocks.filter((block) => block.blockKind === 'criterion');
  const rewardsBlock = blocks.find((block) => block.blockKind === 'reward') ?? null;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-6 py-8 text-white shadow-xl sm:px-8 md:px-10 md:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
          {siteData.settings.navJudgingLabel}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
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
              settings={siteData.settings}
              saving={saving}
              onSave={saveSettings}
              fields={[
                { key: 'navJudgingLabel', label: 'Menu and page label' },
                { key: 'judgingHeroTitle', label: 'Hero title', multiline: true },
                { key: 'judgingIntro', label: 'Page introduction', multiline: true },
                { key: 'judgingCriteriaEyebrow', label: 'Criteria section eyebrow' },
                { key: 'judgingCriteriaTitle', label: 'Criteria section title' },
              ]}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
            {siteData.settings.judgingCriteriaEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {siteData.settings.judgingCriteriaTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Each criterion is scored from {MIN_CRITERION_SCORE} to {MAX_CRITERION_SCORE}.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {criteria.map((criterion, index) => (
            <article
              key={criterion.id}
              className="site-card rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {index + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{criterion.title}</h3>
              <RichTextBody body={criterion.body} className="mt-3 space-y-3" />
            </article>
          ))}
        </div>
      </section>

      {rewardsBlock ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6 shadow-xl">
          <article className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Celebration
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{rewardsBlock.title}</h2>
            <RichTextBody
              body={rewardsBlock.body}
              className="mt-4 max-w-3xl space-y-3"
              paragraphClassName="text-base leading-8 text-slate-700"
            />
            {isEditing ? (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <ContentBlockInlineEditor
                  title="Edit rewards section"
                  block={rewardsBlock}
                  saving={saving}
                  onSave={saveBlock}
                  onDelete={removeBlock}
                  canDelete={false}
                  deleteLabel="Delete rewards section"
                />
              </div>
            ) : null}
          </article>
        </section>
      ) : null}
    </div>
  );
}
