"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  findRelativeAssetPaths,
  wrapHtmlForPreview,
} from "@/lib/services/html-sanitizer";
import { extractImageSources } from "@/lib/services/html-preview-utils";
import { AlertTriangle } from "lucide-react";

interface HtmlEmailPreviewProps {
  html: string;
  className?: string;
}

type ImageStatus = { src: string; ok: boolean; reason?: string };

function checkImageInBrowser(src: string): Promise<ImageStatus> {
  if (src.startsWith("data:") || src.startsWith("cid:")) {
    return Promise.resolve({ src, ok: true });
  }
  if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("//")) {
    return Promise.resolve({
      src,
      ok: false,
      reason: "Relative path — upload assets or use absolute URL",
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ src, ok: true });
    img.onerror = () =>
      resolve({ src, ok: false, reason: "Failed to load image" });
    img.src = src;
  });
}

export function HtmlEmailPreview({ html, className }: HtmlEmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([]);

  const srcDoc = useMemo(() => wrapHtmlForPreview(html), [html]);
  const relativePaths = useMemo(() => findRelativeAssetPaths(html), [html]);
  const imageSources = useMemo(() => extractImageSources(html), [html]);

  useEffect(() => {
    let cancelled = false;

    async function checkImages() {
      const results = await Promise.all(imageSources.map(checkImageInBrowser));
      if (!cancelled) setImageStatuses(results);
    }

    if (imageSources.length > 0) checkImages();
    else setImageStatuses([]);

    return () => {
      cancelled = true;
    };
  }, [imageSources]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function resize() {
      if (!iframe) return;
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) return;
        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight ?? 0,
          400
        );
        setIframeHeight(Math.min(height + 16, 2400));
      } catch {
        setIframeHeight(500);
      }
    }

    iframe.addEventListener("load", resize);
    const timer = window.setTimeout(resize, 100);

    return () => {
      iframe.removeEventListener("load", resize);
      window.clearTimeout(timer);
    };
  }, [srcDoc]);

  if (!html.trim()) return null;

  const brokenImages = imageStatuses.filter((s) => !s.ok);
  const unresolvedRelative = relativePaths.filter(
    (path) => !imageSources.includes(path)
  );

  return (
    <div className={className}>
      {(brokenImages.length > 0 || unresolvedRelative.length > 0) && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Image issues detected
          </div>
          <ul className="list-inside list-disc space-y-1 text-xs">
            {brokenImages.map((img) => (
              <li key={img.src}>
                <span className="font-mono">{img.src.slice(0, 80)}</span>
                {img.reason ? ` — ${img.reason}` : ""}
              </li>
            ))}
            {unresolvedRelative.map((path) => (
              <li key={path}>
                <span className="font-mono">{path}</span> — relative asset not
                uploaded
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-[80vh] overflow-auto rounded-lg border bg-white">
        <iframe
          ref={iframeRef}
          title="Email preview"
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          className="w-full border-0"
          style={{ height: iframeHeight, minHeight: 400 }}
          loading="lazy"
        />
      </div>
    </div>
  );
}
