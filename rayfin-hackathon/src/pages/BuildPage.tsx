import type { ReactNode } from 'react';

import {
  ContentBlockInlineEditor,
  SiteSettingsInlineEditor,
} from '@/components/ContentEditors';
import { getBlocksForPage } from '@/content/defaultContent';
import { useSitePageContext } from '@/hooks/useSitePageContext';
import { useNextSortOrder } from '@/hooks/useNextSortOrder';

const bodyLinkPattern = /(?:https?:\/\/|www\.)[^\s]+/gi;
const trailingLinkPunctuationPattern = /[),.!?;:\]]+$/;

function renderParagraph(paragraph: string, paragraphIndex: number) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of paragraph.matchAll(bodyLinkPattern)) {
    const startIndex = match.index ?? 0;
    const matchedText = match[0];
    const trimmedMatch = matchedText.replace(trailingLinkPunctuationPattern, '');

    if (!trimmedMatch) {
      continue;
    }

    const trailingText = matchedText.slice(trimmedMatch.length);

    if (startIndex > lastIndex) {
      parts.push(paragraph.slice(lastIndex, startIndex));
    }

    parts.push(
      <a
        key={`link-${paragraphIndex}-${startIndex}`}
        href={trimmedMatch.startsWith('www.') ? `https://${trimmedMatch}` : trimmedMatch}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-blue-700 underline underline-offset-2 transition hover:text-blue-800"
      >
        {trimmedMatch}
      </a>
    );

    if (trailingText) {
      parts.push(trailingText);
    }

    lastIndex = startIndex + matchedText.length;
  }

  if (lastIndex === 0) {
    return paragraph;
  }

  if (lastIndex < paragraph.length) {
    parts.push(paragraph.slice(lastIndex));
  }

  return parts;
}

function renderBody(body: string) {
  return body.split('\n').map((paragraph, index) => (
    <p key={`paragraph-${index}`} className="text-sm leading-7 text-slate-600">
      {renderParagraph(paragraph, index)}
    </p>
  ));
}

export function BuildPage() {
  const {
    isEditing,
    siteData,
    saving,
    saveSettings,
    saveBlock,
    removeBlock,
  } = useSitePageContext();
  const blocks = getBlocksForPage(siteData.blocks, 'build');
  const nextSortOrder = useNextSortOrder(blocks);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 py-12 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
          {siteData.settings.navBuildLabel}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          {siteData.settings.buildHeroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
          {siteData.settings.buildIntro}
        </p>

        {isEditing ? (
          <div className="mt-8 max-w-3xl">
            <SiteSettingsInlineEditor
              title="Edit page introduction"
              description="Update the opening guidance shown at the top of this page."
              settings={siteData.settings}
              saving={saving}
              onSave={saveSettings}
              fields={[
                {
                  key: 'navBuildLabel',
                  label: 'Menu and page label',
                },
                {
                  key: 'buildHeroTitle',
                  label: 'Hero title',
                  multiline: true,
                },
                {
                  key: 'buildIntro',
                  label: 'Page introduction',
                  multiline: true,
                },
                {
                  key: 'buildIdeasEyebrow',
                  label: 'Ideas section eyebrow',
                },
                {
                  key: 'buildIdeasTitle',
                  label: 'Ideas section title',
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
              {siteData.settings.buildIdeasEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {siteData.settings.buildIdeasTitle}
            </h2>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={() =>
                void saveBlock({
                  id: crypto.randomUUID(),
                  pageKey: 'build',
                  blockKind: 'idea',
                  title: 'New build idea',
                  body:
                    'Describe the concept, audience, and why it would make a strong hackathon entry.',
                  sortOrder: nextSortOrder,
                }).catch(() => undefined)
              }
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add idea card
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {blocks.map((block) => (
            <article
              key={block.id}
              className="site-card overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm"
            >
              {block.imageUrl ? (
                <img
                  src={block.imageUrl}
                  alt=""
                  className="h-52 w-full object-cover"
                />
              ) : null}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-950">{block.title}</h2>
                <div className="mt-3 space-y-3">{renderBody(block.body)}</div>
                {block.ctaLabel && block.ctaUrl ? (
                  <a
                    href={block.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    {block.ctaLabel}
                  </a>
                ) : null}

                {isEditing ? (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <ContentBlockInlineEditor
                      title="Edit idea card"
                      block={block}
                      saving={saving}
                      onSave={saveBlock}
                      onDelete={removeBlock}
                      canDelete={true}
                      deleteLabel="Delete idea card"
                      showImageField={true}
                      showCallToActionFields={true}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
