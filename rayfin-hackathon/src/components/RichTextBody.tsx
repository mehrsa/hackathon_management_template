import type { ReactNode } from 'react';

const bodyLinkPattern =
  /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s]+)/gi;
const trailingLinkPunctuationPattern = /[),.!?;:\]]+$/;

function normalizeUrl(url: string) {
  return url.startsWith('www.') ? `https://${url}` : url;
}

function renderParagraphContent(paragraph: string, paragraphIndex: number) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of paragraph.matchAll(bodyLinkPattern)) {
    const startIndex = match.index ?? 0;
    const matchedText = match[0];
    const customLinkLabel = match[1];
    const customLinkUrl = match[2];
    const rawUrl = match[3];

    let linkLabel = customLinkLabel;
    let href = customLinkUrl;
    let trailingText = '';

    if (!href && rawUrl) {
      const trimmedUrl = rawUrl.replace(trailingLinkPunctuationPattern, '');
      if (!trimmedUrl) {
        continue;
      }

      linkLabel = trimmedUrl;
      href = trimmedUrl;
      trailingText = rawUrl.slice(trimmedUrl.length);
    }

    if (startIndex > lastIndex) {
      parts.push(paragraph.slice(lastIndex, startIndex));
    }

    if (!linkLabel || !href) {
      parts.push(matchedText);
      lastIndex = startIndex + matchedText.length;
      continue;
    }

    parts.push(
      <a
        key={`link-${paragraphIndex}-${startIndex}`}
        href={normalizeUrl(href)}
        target="_blank"
        rel="noreferrer"
        className="relative z-10 pointer-events-auto font-medium text-blue-700 underline underline-offset-2 transition hover:text-blue-800"
      >
        {linkLabel}
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

interface RichTextBodyProps {
  body: string;
  className?: string;
  paragraphClassName?: string;
}

export function RichTextBody({
  body,
  className = 'space-y-3',
  paragraphClassName = 'text-sm leading-7 text-slate-600',
}: RichTextBodyProps) {
  return (
    <div className={className}>
      {body.split('\n').map((paragraph, index) => (
        <p
          key={`paragraph-${index}-${paragraph}`}
          className={paragraphClassName}
        >
          {renderParagraphContent(paragraph, index)}
        </p>
      ))}
    </div>
  );
}
