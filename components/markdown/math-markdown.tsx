"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { DefinitionTerm } from "@/components/ui/definition-tooltip";

export const MathMarkdown = ({
  content,
  definitions,
}: {
  content: string;
  definitions?: Record<string, string>;
}) => {
  return (
    <div className="space-y-4">
      <article className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink prose-code:text-accent dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </article>
      {definitions && Object.keys(definitions).length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-elevated px-3 py-2 text-xs text-muted">
          <span className="text-[11px] uppercase tracking-[0.15em] text-soft">
            Definitions
          </span>
          {Object.entries(definitions).map(([term, definition]) => (
            <DefinitionTerm key={term} term={term} definition={definition} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
