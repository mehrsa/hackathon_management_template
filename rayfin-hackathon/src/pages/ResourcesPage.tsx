import { Link } from 'react-router-dom';

import { ContentBlockInlineEditor } from '@/components/ContentEditors';
import { RichTextBody } from '@/components/RichTextBody';
import { getBlocksForPage } from '@/content/defaultContent';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import type { BlockKind, ContentBlockRecord } from '@/types/site';

function ResourceLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    'mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100';

  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}

interface ResourceSectionConfig {
  id: 'learning-library' | 'recordings' | 'upcoming-sessions';
  sectionKind:
    | 'resourceLibrarySection'
    | 'resourceRecordingsSection'
    | 'resourceUpcomingSessionsSection';
  itemKinds: BlockKind[];
  badgeLabel: string;
  addLabel: string;
  addButtonLabel: string;
  emptyState: string;
  newCard: Pick<ContentBlockRecord, 'blockKind' | 'title' | 'body' | 'ctaLabel' | 'ctaUrl'>;
  editorTitle: string;
  editorDescription: string;
  bodyPlaceholder: string;
  callToActionLabelFieldLabel: string;
  callToActionUrlFieldLabel: string;
  callToActionLabelPlaceholder?: string;
  callToActionUrlPlaceholder?: string;
}

const resourceSections: ResourceSectionConfig[] = [
  {
    id: 'learning-library',
    sectionKind: 'resourceLibrarySection',
    itemKinds: ['resource'],
    badgeLabel: 'Learning library',
    addLabel: 'resource',
    addButtonLabel: 'Add learning resource',
    emptyState: 'No learning resources have been added yet.',
    newCard: {
      blockKind: 'resource',
      title: 'New learning resource',
      body: 'Summarize what participants will learn here and why this resource is useful.',
      ctaLabel: 'Open resource',
      ctaUrl: 'https://example.com/resource',
    },
    editorTitle: 'Edit learning resource',
    editorDescription: 'Use this section for docs, repos, references, and self-paced materials.',
    bodyPlaceholder:
      'Explain what this resource covers, who should use it, and when it is most helpful.',
    callToActionLabelFieldLabel: 'Button label',
    callToActionUrlFieldLabel: 'Resource URL',
    callToActionLabelPlaceholder: 'Open resource',
    callToActionUrlPlaceholder: 'https://example.com/resource',
  },
  {
    id: 'recordings',
    sectionKind: 'resourceRecordingsSection',
    itemKinds: ['recording'],
    badgeLabel: 'Recording',
    addLabel: 'recording',
    addButtonLabel: 'Add recording',
    emptyState: 'No recordings have been added yet.',
    newCard: {
      blockKind: 'recording',
      title: 'New recording',
      body: 'Share what this recording covers and why participants should watch it.',
      ctaLabel: 'Watch recording',
      ctaUrl: 'https://example.com/recording',
    },
    editorTitle: 'Edit recording',
    editorDescription: 'Use recordings for session replays, demos, and walkthroughs.',
    bodyPlaceholder:
      'Summarize the session, highlight key takeaways, and note who should watch it.',
    callToActionLabelFieldLabel: 'Button label',
    callToActionUrlFieldLabel: 'Recording URL',
    callToActionLabelPlaceholder: 'Watch recording',
    callToActionUrlPlaceholder: 'https://example.com/recording',
  },
  {
    id: 'upcoming-sessions',
    sectionKind: 'resourceUpcomingSessionsSection',
    itemKinds: ['upcomingSession'],
    badgeLabel: 'Upcoming session',
    addLabel: 'session',
    addButtonLabel: 'Add upcoming session',
    emptyState: 'No upcoming sessions have been added yet.',
    newCard: {
      blockKind: 'upcomingSession',
      title: 'New upcoming session',
      body: 'Add the session date, what it covers, and any notes participants should know before joining.',
      ctaLabel: 'Add to calendar',
      ctaUrl: 'https://teams.microsoft.com/l/meetup-join/example',
    },
    editorTitle: 'Edit upcoming session',
    editorDescription:
      'Use the Teams meeting link so attendees can open the invite or add it to their calendar.',
    bodyPlaceholder:
      'Include the date, agenda, office hours details, and any prep work for attendees.',
    callToActionLabelFieldLabel: 'Button label',
    callToActionUrlFieldLabel: 'Teams meeting link',
    callToActionLabelPlaceholder: 'Add to calendar',
    callToActionUrlPlaceholder: 'https://teams.microsoft.com/l/meetup-join/...',
  },
];

export function ResourcesPage() {
  const {
    isEditing,
    siteData,
    saving,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const resources = getBlocksForPage(siteData.blocks, 'resources');
  const nextSortOrder = useNextSortOrder(resources);

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] px-8 py-7 md:px-10 md:py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          Resources
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl lg:text-[2.7rem]">
          Explore learning resources
        </h1>
        <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-slate-700">
          Including session recordings, upcoming sessions and office hours schedule, docs, repos
          and more.
        </p>
      </section>

      {resourceSections.map((section) => {
        const sectionBlock = resources.find((block) => block.blockKind === section.sectionKind);
        const sectionItems = resources.filter((block) => section.itemKinds.includes(block.blockKind));

        if (!sectionBlock) {
          return null;
        }

        return (
          <section key={section.id} className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                  {section.badgeLabel}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{sectionBlock.title}</h2>
                {sectionBlock.body ? (
                  <RichTextBody body={sectionBlock.body} className="mt-3 space-y-3 text-slate-700" />
                ) : null}
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() =>
                    void saveBlock({
                      id: crypto.randomUUID(),
                      pageKey: 'resources',
                      blockKind: section.newCard.blockKind,
                      title: section.newCard.title,
                      body: section.newCard.body,
                      ctaLabel: section.newCard.ctaLabel,
                      ctaUrl: section.newCard.ctaUrl,
                      sortOrder: nextSortOrder,
                    }).catch(() => undefined)
                  }
                  disabled={saving}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {section.addButtonLabel}
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <ContentBlockInlineEditor
                title={`Edit ${sectionBlock.title}`}
                description="Update the section title or supporting copy shown above its cards."
                block={sectionBlock}
                saving={saving}
                onSave={saveBlock}
                onDelete={removeBlock}
                canDelete={false}
                bodyLabel="Section description"
                bodyPlaceholder="Add optional context for this section."
              />
            ) : null}

            {sectionItems.length === 0 ? (
              <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
                {section.emptyState}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sectionItems.map((resource) => (
                  <article
                    key={resource.id}
                    className="site-card rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm"
                  >
                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                      {section.badgeLabel}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-slate-950">{resource.title}</h3>
                    <RichTextBody body={resource.body} className="mt-3 space-y-3" />
                    {resource.ctaLabel && resource.ctaUrl ? (
                      <ResourceLink href={resource.ctaUrl} label={resource.ctaLabel} />
                    ) : null}

                    {isEditing ? (
                      <div className="mt-5 border-t border-slate-200 pt-5">
                        <ContentBlockInlineEditor
                          title={section.editorTitle}
                          description={section.editorDescription}
                          block={resource}
                          saving={saving}
                          onSave={saveBlock}
                          onDelete={removeBlock}
                          canDelete={true}
                          deleteLabel={`Delete ${section.addLabel}`}
                          showCallToActionFields={true}
                          bodyPlaceholder={section.bodyPlaceholder}
                          callToActionLabelFieldLabel={section.callToActionLabelFieldLabel}
                          callToActionUrlFieldLabel={section.callToActionUrlFieldLabel}
                          callToActionLabelPlaceholder={section.callToActionLabelPlaceholder}
                          callToActionUrlPlaceholder={section.callToActionUrlPlaceholder}
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
