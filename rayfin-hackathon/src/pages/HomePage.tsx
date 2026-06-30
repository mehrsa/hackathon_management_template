import { Link } from 'react-router-dom';

import {
  ContentBlockInlineEditor,
  SiteSettingsInlineEditor,
  TimelineMilestoneInlineEditor,
} from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import {
  getBlocksForPage,
  isDefaultBlockId,
  isDefaultTimelineId,
} from '@/content/defaultContent';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';
import { useSitePageContext } from '@/hooks/useSitePageContext';

export function HomePage() {
  const {
    isEditing,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
    saveTimelineMilestone,
    removeTimelineMilestone,
  } = useSitePageContext();
  const goals = getBlocksForPage(siteData.blocks, 'home');
  const nextGoalSortOrder = useNextSortOrder(goals);
  const nextTimelineSortOrder = useNextSortOrder(siteData.timeline);
  const exploreItems = [
    {
      href: '/build',
      title: siteData.settings.navBuildLabel,
      description: siteData.settings.homeExploreBuildDescription,
    },
    {
      href: '/judging',
      title: siteData.settings.navJudgingLabel,
      description: siteData.settings.homeExploreJudgingDescription,
    },
    {
      href: '/submit',
      title: siteData.settings.navSubmitLabel,
      description: siteData.settings.homeExploreSubmitDescription,
    },
    {
      href: '/projects',
      title: siteData.settings.navProjectsLabel,
      description: siteData.settings.homeExploreProjectsDescription,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-emerald-50 px-8 py-8 text-slate-950 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.55),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(167,243,208,0.45),transparent_36%)]" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">
                {siteData.settings.heroBadge}
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl lg:text-[3.2rem]">
                {siteData.settings.bannerTitle}
              </h1>
              <RichTextBody
                body={siteData.settings.bannerDescription}
                className="mt-5 max-w-2xl space-y-3"
                paragraphClassName="text-[1.02rem] leading-8 text-slate-700"
              />

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Register now
                </Link>
                <a
                  href="#timeline"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white/85 px-8 py-3 text-base font-semibold text-emerald-900 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  View timeline
                </a>
              </div>

              {isEditing ? (
                <div className="mt-8 max-w-3xl">
                  <SiteSettingsInlineEditor
                    title="Edit hero section"
                    description="Update the announcement and hero artwork directly from the main page."
                    settings={siteData.settings}
                    saving={saving}
                    onSave={saveSettings}
                    fields={[
                      { key: 'siteTitle', label: 'Site title' },
                      {
                        key: 'siteDescription',
                        label: 'Site description (supports [link text](https://example.com))',
                        multiline: true,
                      },
                      { key: 'heroBadge', label: 'Hero badge' },
                      { key: 'bannerTitle', label: 'Banner title' },
                      {
                        key: 'bannerDescription',
                        label:
                          'Banner description (supports [link text](https://example.com))',
                        multiline: true,
                      },
                      { key: 'bannerImageUrl', label: 'Banner image URL' },
                    ]}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden bg-gradient-to-br from-white via-blue-100 to-emerald-100 p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_36%)]" />
            <div className="relative flex h-full items-center justify-center">
              <img
                src={siteData.settings.bannerImageUrl}
                alt="Rayfin Hackathon banner"
                className="ml-auto h-full min-h-[300px] w-full max-w-lg rounded-[1.75rem] border border-white/80 object-cover object-center shadow-2xl shadow-blue-950/15"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {siteData.settings.homeIntroTitle}
              </h2>
            </div>
          </div>
          <RichTextBody
            body={siteData.settings.homeIntroBody}
            className="mt-4 max-w-3xl space-y-3"
            paragraphClassName="text-base leading-8 text-slate-700"
          />

          {isEditing ? (
            <div className="mt-6 max-w-3xl">
              <SiteSettingsInlineEditor
                title="Edit welcome section"
                description="Update the welcome heading and supporting copy shown below the banner."
                settings={siteData.settings}
                saving={saving}
                onSave={saveSettings}
                fields={[
                  { key: 'homeIntroTitle', label: 'Section title' },
                  {
                    key: 'homeIntroBody',
                    label: 'Section body (supports [link text](https://example.com))',
                    multiline: true,
                  },
                ]}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-emerald-950">
            {siteData.settings.homeExploreTitle}
          </h2>
          <div className="mt-4 grid gap-3">
            {exploreItems.map((item) => (
              <article
                key={item.href}
                className="site-card group relative rounded-2xl bg-white/90 p-4"
              >
                <Link
                  to={item.href}
                  aria-label={item.title}
                  className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50"
                >
                  <span className="sr-only">{item.title}</span>
                </Link>
                <div className="pointer-events-none relative z-10">
                  <h3 className="font-semibold text-slate-950 transition group-hover:text-blue-700">
                    {item.title}
                  </h3>
                  <RichTextBody
                    body={item.description}
                    className="mt-1 space-y-2"
                    paragraphClassName="text-base leading-7 text-slate-700"
                  />
                </div>
              </article>
            ))}
          </div>

          {isEditing ? (
            <div className="mt-6 border-t border-emerald-200/80 pt-6">
              <SiteSettingsInlineEditor
                title="Edit menu and shortcut copy"
                description="Update the shared navigation labels, this section title, and the description shown below each shortcut."
                settings={siteData.settings}
                saving={saving}
                onSave={saveSettings}
                fields={[
                  { key: 'homeExploreTitle', label: 'Quick-links section title' },
                  { key: 'navBuildLabel', label: 'Menu label: build page' },
                  {
                    key: 'homeExploreBuildDescription',
                    label:
                      'Description: build page (supports [link text](https://example.com))',
                    multiline: true,
                  },
                  { key: 'navJudgingLabel', label: 'Menu label: judging page' },
                  {
                    key: 'homeExploreJudgingDescription',
                    label:
                      'Description: judging page (supports [link text](https://example.com))',
                    multiline: true,
                  },
                  { key: 'navSubmitLabel', label: 'Menu label: submit page' },
                  {
                    key: 'homeExploreSubmitDescription',
                    label:
                      'Description: submit page (supports [link text](https://example.com))',
                    multiline: true,
                  },
                  { key: 'navProjectsLabel', label: 'Menu label: proposed projects page' },
                  {
                    key: 'homeExploreProjectsDescription',
                    label:
                      'Description: proposed projects page (supports [link text](https://example.com))',
                    multiline: true,
                  },
                ]}
                className="bg-white/90"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-slate-950">
              {siteData.settings.homeGoalsTitle}
            </h2>
            {isEditing ? (
              <div className="mt-4 max-w-2xl">
                <SiteSettingsInlineEditor
                  title="Edit goals section title"
                  settings={siteData.settings}
                  saving={saving}
                  onSave={saveSettings}
                  fields={[{ key: 'homeGoalsTitle', label: 'Section title' }]}
                />
              </div>
            ) : null}
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={() =>
                void saveBlock({
                  id: crypto.randomUUID(),
                  pageKey: 'home',
                  blockKind: 'goal',
                  title: 'New goal',
                  body: 'Describe another outcome the hackathon should drive.',
                  sortOrder: nextGoalSortOrder,
                }).catch(() => undefined)
              }
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add goal
            </button>
          ) : null}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {goals.map((goal, index) => (
            <article
              key={goal.id}
              className="site-card rounded-3xl border border-white/70 bg-slate-50/90 p-5"
            >
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Goal {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{goal.title}</h3>
              <RichTextBody body={goal.body} className="mt-3 space-y-3" />

              {isEditing ? (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <ContentBlockInlineEditor
                    title={`Edit goal ${index + 1}`}
                    block={goal}
                    saving={saving}
                    onSave={saveBlock}
                    onDelete={removeBlock}
                    canDelete={!isDefaultBlockId(goal.id)}
                    deleteLabel="Delete goal"
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section id="timeline" className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              {siteData.settings.homeTimelineTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Follow the event from kickoff through judging in one chronological view.
            </p>
            {isEditing ? (
              <div className="mt-4 max-w-2xl">
                <SiteSettingsInlineEditor
                  title="Edit timeline section title"
                  settings={siteData.settings}
                  saving={saving}
                  onSave={saveSettings}
                  fields={[{ key: 'homeTimelineTitle', label: 'Section title' }]}
                />
              </div>
            ) : null}
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={() =>
                void saveTimelineMilestone({
                  id: crypto.randomUUID(),
                  dateLabel: 'July 30, 2026',
                  milestone: 'New milestone',
                  description:
                    'Describe the milestone or event update for participants.',
                  sortOrder: nextTimelineSortOrder,
                }).catch(() => undefined)
              }
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add milestone
            </button>
          ) : null}
        </div>
        <div className="relative mt-8">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-cyan-200 via-blue-300 to-amber-200 md:left-1/2 md:-translate-x-1/2" />
          {siteData.timeline.map((item, index) => (
            <div
              key={item.id}
              className="relative grid gap-4 pb-8 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6"
            >
              <div
                className={`ml-14 md:ml-0 ${
                  index % 2 === 0 ? 'md:col-start-1' : 'md:col-start-3'
                }`}
              >
                <article className="site-card rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/60">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                    {item.dateLabel}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.milestone}</h3>
                  <RichTextBody
                    body={item.description}
                    className="mt-2 space-y-3"
                  />

                  {isEditing ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <TimelineMilestoneInlineEditor
                        title={`Edit milestone ${index + 1}`}
                        item={item}
                        saving={saving}
                        onSave={saveTimelineMilestone}
                        onDelete={removeTimelineMilestone}
                        canDelete={!isDefaultTimelineId(item.id)}
                      />
                    </div>
                  ) : null}
                </article>
              </div>
              <div className="absolute left-0 top-3 md:static md:col-start-2 md:row-start-1 md:justify-self-center">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-slate-50 bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-300/40">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
