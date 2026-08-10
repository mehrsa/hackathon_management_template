import type { ReactNode } from 'react';

const customLinkPattern = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)/gi;
const rawUrlPattern = /(?:https?:\/\/|www\.)[^\s]+/gi;
const unorderedListPattern = /^[-*]\s+(.+)$/;
const orderedListPattern = /^(\d+)\.\s+(.+)$/;
const trailingLinkPunctuationPattern = /[),.!?;:\]]+$/;

const colorClassNames = {
  amber: 'text-amber-700',
  blue: 'text-blue-700',
  green: 'text-emerald-700',
  purple: 'text-violet-700',
  rose: 'text-rose-700',
  slate: 'text-slate-700',
} as const;

type SupportedColor = keyof typeof colorClassNames;

interface RichTextSegment {
  type: 'paragraph' | 'unordered-list' | 'ordered-list';
  lines: string[];
}

function normalizeUrl(url: string) {
  return url.startsWith('www.') ? `https://${url}` : url;
}

function findNextInlineToken(source: string, startIndex: number) {
  const customLinkMatch = (() => {
    customLinkPattern.lastIndex = startIndex;
    return customLinkPattern.exec(source);
  })();
  const rawUrlMatch = (() => {
    rawUrlPattern.lastIndex = startIndex;
    return rawUrlPattern.exec(source);
  })();
  const boldIndex = source.indexOf('**', startIndex);
  const colorMatch = (() => {
    const match = /\{(amber|blue|green|purple|rose|slate)\}/gi;
    match.lastIndex = startIndex;
    return match.exec(source);
  })();

  const candidates = [
    customLinkMatch
      ? { type: 'custom-link' as const, index: customLinkMatch.index ?? startIndex, match: customLinkMatch }
      : null,
    rawUrlMatch
      ? { type: 'raw-link' as const, index: rawUrlMatch.index ?? startIndex, match: rawUrlMatch }
      : null,
    boldIndex >= 0 ? { type: 'bold' as const, index: boldIndex } : null,
    colorMatch
      ? { type: 'color' as const, index: colorMatch.index ?? startIndex, match: colorMatch }
      : null,
  ].filter((candidate) => candidate !== null);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((earliest, candidate) =>
    candidate.index < earliest.index ? candidate : earliest
  );
}

function renderInlineContent(source: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const normalizedSource = source.toLowerCase();
  let cursor = 0;

  while (cursor < source.length) {
    const nextToken = findNextInlineToken(source, cursor);

    if (!nextToken) {
      parts.push(source.slice(cursor));
      break;
    }

    if (nextToken.index > cursor) {
      parts.push(source.slice(cursor, nextToken.index));
    }

    if (nextToken.type === 'custom-link') {
      const [, linkLabel, href] = nextToken.match;
      const matchedText = nextToken.match[0];

      parts.push(
        <a
          key={`${keyPrefix}-custom-link-${nextToken.index}`}
          href={normalizeUrl(href)}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 pointer-events-auto font-medium text-blue-700 underline decoration-blue-300 underline-offset-3 transition hover:text-blue-800"
        >
          {renderInlineContent(linkLabel, `${keyPrefix}-custom-link-label-${nextToken.index}`)}
        </a>
      );

      cursor = nextToken.index + matchedText.length;
      continue;
    }

    if (nextToken.type === 'raw-link') {
      const rawUrl = nextToken.match[0];
      const trimmedUrl = rawUrl.replace(trailingLinkPunctuationPattern, '');

      if (!trimmedUrl) {
        parts.push(rawUrl);
        cursor = nextToken.index + rawUrl.length;
        continue;
      }

      const trailingText = rawUrl.slice(trimmedUrl.length);

      parts.push(
        <a
          key={`${keyPrefix}-raw-link-${nextToken.index}`}
          href={normalizeUrl(trimmedUrl)}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 pointer-events-auto font-medium text-blue-700 underline decoration-blue-300 underline-offset-3 transition hover:text-blue-800"
        >
          {trimmedUrl}
        </a>
      );

      if (trailingText) {
        parts.push(trailingText);
      }

      cursor = nextToken.index + rawUrl.length;
      continue;
    }

    if (nextToken.type === 'bold') {
      const closingIndex = source.indexOf('**', nextToken.index + 2);

      if (closingIndex === -1) {
        parts.push('**');
        cursor = nextToken.index + 2;
        continue;
      }

      const content = source.slice(nextToken.index + 2, closingIndex);

      parts.push(
        <strong
          key={`${keyPrefix}-bold-${nextToken.index}`}
          className="font-semibold text-slate-950"
        >
          {renderInlineContent(content, `${keyPrefix}-bold-content-${nextToken.index}`)}
        </strong>
      );

      cursor = closingIndex + 2;
      continue;
    }

    const color = nextToken.match[1].toLowerCase() as SupportedColor;
    const openingToken = nextToken.match[0];
    const closingToken = `{/${color}}`;
    const contentStart = nextToken.index + openingToken.length;
    const closingIndex = normalizedSource.indexOf(closingToken, contentStart);

    if (closingIndex === -1) {
      parts.push(openingToken);
      cursor = contentStart;
      continue;
    }

    const content = source.slice(contentStart, closingIndex);

    parts.push(
      <span
        key={`${keyPrefix}-color-${nextToken.index}`}
        className={colorClassNames[color]}
      >
        {renderInlineContent(content, `${keyPrefix}-color-content-${nextToken.index}`)}
      </span>
    );

    cursor = closingIndex + closingToken.length;
  }

  return parts;
}

function buildSegments(body: string): RichTextSegment[] {
  const lines = body.split('\n');
  const segments: RichTextSegment[] = [];

  let listType: RichTextSegment['type'] | null = null;
  let listLines: string[] = [];

  const flushList = () => {
    if (!listType || listLines.length === 0) {
      listType = null;
      listLines = [];
      return;
    }

    segments.push({
      type: listType,
      lines: listLines,
    });
    listType = null;
    listLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const unorderedMatch = trimmed.match(unorderedListPattern);
    if (unorderedMatch) {
      if (listType && listType !== 'unordered-list') {
        flushList();
      }

      listType = 'unordered-list';
      listLines.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(orderedListPattern);
    if (orderedMatch) {
      if (listType && listType !== 'ordered-list') {
        flushList();
      }

      listType = 'ordered-list';
      listLines.push(orderedMatch[2]);
      continue;
    }

    flushList();
    segments.push({
      type: 'paragraph',
      lines: [line],
    });
  }

  flushList();

  return segments.length > 0 ? segments : [{ type: 'paragraph', lines: [''] }];
}

interface RichTextBodyProps {
  body?: string | null;
  className?: string;
  paragraphClassName?: string;
  unorderedListClassName?: string;
  unorderedListItemClassName?: string;
}

export function RichTextBody({
  body,
  className = 'space-y-3',
  paragraphClassName = 'text-base leading-8 text-slate-700',
  unorderedListClassName = 'ml-5 list-disc space-y-2 text-base leading-8 text-slate-700 marker:text-slate-400',
  unorderedListItemClassName = '',
}: RichTextBodyProps) {
  const normalizedBody = typeof body === 'string' ? body : '';
  const segments = buildSegments(normalizedBody);

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'ordered-list') {
          return (
            <ol
              key={`segment-${index}`}
              className="ml-5 list-decimal space-y-2 text-base leading-8 text-slate-700 marker:font-semibold marker:text-slate-400"
            >
              {segment.lines.map((line, lineIndex) => (
                <li key={`ordered-item-${index}-${lineIndex}`}>
                  {renderInlineContent(line, `ordered-item-${index}-${lineIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (segment.type === 'unordered-list') {
          return (
            <ul key={`segment-${index}`} className={unorderedListClassName}>
              {segment.lines.map((line, lineIndex) => (
                <li
                  key={`unordered-item-${index}-${lineIndex}`}
                  className={unorderedListItemClassName}
                >
                  {renderInlineContent(line, `unordered-item-${index}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`segment-${index}`} className={paragraphClassName}>
            {renderInlineContent(segment.lines[0], `paragraph-${index}`)}
          </p>
        );
      })}
    </div>
  );
}
