"use client";

import { useState } from "react";

export const DefinitionTerm = ({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      className="relative mx-0.5 inline-flex cursor-help border-b border-dashed border-accent/70 text-ink"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-label={`Definition for ${term}`}
    >
      {term}
      {open ? (
        <span className="absolute left-0 top-6 z-20 w-64 rounded-md border border-line bg-panel p-2 text-xs font-normal leading-relaxed text-muted shadow-sm">
          {definition}
        </span>
      ) : null}
    </button>
  );
};
