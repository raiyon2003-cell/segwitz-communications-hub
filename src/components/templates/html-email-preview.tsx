"use client";

import { useMemo } from "react";
import { wrapHtmlForPreview } from "@/lib/services/html-sanitizer";

interface HtmlEmailPreviewProps {
  html: string;
  className?: string;
}

export function HtmlEmailPreview({ html, className }: HtmlEmailPreviewProps) {
  const srcDoc = useMemo(() => wrapHtmlForPreview(html), [html]);

  if (!html.trim()) return null;

  return (
    <div className={className}>
      <iframe
        title="Email preview"
        srcDoc={srcDoc}
        sandbox=""
        className="h-[500px] w-full rounded-lg border bg-white"
        loading="lazy"
      />
    </div>
  );
}
