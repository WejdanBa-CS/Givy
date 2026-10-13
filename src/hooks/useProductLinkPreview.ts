"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_LIMITS, safeHttpsUrl } from "@/lib/security";

type PreviewPayload = {
  imageUrl?: string | null;
  title?: string | null;
};

async function requestPreview(
  httpsUrl: string,
  signal?: AbortSignal,
): Promise<PreviewPayload | null> {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(httpsUrl)}`, {
    credentials: "same-origin",
    signal,
  });
  if (!res.ok) return null;
  return (await res.json()) as PreviewPayload;
}

/**
 * When the user pastes a product URL, pull OG/JSON-LD photo (+ title) so the
 * gift card shows the real product image in the list.
 */
export function useProductLinkPreview({
  url,
  imageHint,
  title,
  setImageHint,
  setTitle,
}: {
  url: string;
  imageHint: string;
  title: string;
  setImageHint: (value: string) => void;
  setTitle: (value: string) => void;
}) {
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewMiss, setPreviewMiss] = useState(false);
  const autoImageRef = useRef<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const titleRef = useRef(title);
  const imageHintRef = useRef(imageHint);
  titleRef.current = title;
  imageHintRef.current = imageHint;

  useEffect(() => {
    const https = safeHttpsUrl(url);
    if (!https) {
      lastUrlRef.current = null;
      setPreviewMiss(false);
      return;
    }

    const urlChanged = lastUrlRef.current !== null && lastUrlRef.current !== https;
    const currentImage = imageHintRef.current.trim();
    const wasAuto = Boolean(
      currentImage && autoImageRef.current && currentImage === autoImageRef.current,
    );
    const manualImage = Boolean(currentImage && !wasAuto);

    // New product link → drop previous auto photo so we can replace it.
    if (urlChanged && wasAuto) {
      setImageHint("");
      autoImageRef.current = null;
    }

    // Don't overwrite a photo the user typed by hand.
    if (manualImage && !urlChanged) return;
    if (lastUrlRef.current === https && currentImage) return;

    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      lastUrlRef.current = https;
      setPreviewBusy(true);
      setPreviewMiss(false);
      void requestPreview(https, controller.signal)
        .then((data) => {
          if (!data) {
            setPreviewMiss(true);
            return;
          }
          if (data.imageUrl) {
            const stillEmptyOrAuto =
              !imageHintRef.current.trim() ||
              imageHintRef.current.trim() === autoImageRef.current;
            if (stillEmptyOrAuto) {
              autoImageRef.current = data.imageUrl;
              setImageHint(data.imageUrl);
            }
            setPreviewMiss(false);
          } else {
            setPreviewMiss(true);
          }
          if (data.title && !titleRef.current.trim()) {
            setTitle(data.title.slice(0, FIELD_LIMITS.itemTitle));
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setPreviewMiss(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setPreviewBusy(false);
        });
    }, 450);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [url, setImageHint, setTitle]);

  /** Call on submit so a fast click still saves the product photo + title. */
  const ensurePreview = useCallback(async (): Promise<{
    imageUrl?: string;
    title?: string;
  }> => {
    const https = safeHttpsUrl(url);
    const existingImage =
      safeHttpsUrl(imageHintRef.current) ??
      (imageHintRef.current.trim() &&
      !/^[a-z][a-z0-9+.-]*:/i.test(imageHintRef.current.trim())
        ? imageHintRef.current.trim()
        : undefined);
    const existingTitle = titleRef.current.trim() || undefined;

    if (existingImage && /^https:\/\//i.test(existingImage) && existingTitle) {
      return { imageUrl: existingImage, title: existingTitle };
    }
    if (!https) return { imageUrl: existingImage, title: existingTitle };

    setPreviewBusy(true);
    try {
      const data = await requestPreview(https);
      const imageUrl = data?.imageUrl || existingImage;
      const nextTitle =
        existingTitle ||
        (data?.title ? data.title.slice(0, FIELD_LIMITS.itemTitle) : undefined);
      if (data?.imageUrl) {
        autoImageRef.current = data.imageUrl;
        setImageHint(data.imageUrl);
      } else if (!existingImage) {
        setPreviewMiss(true);
      }
      if (nextTitle && !existingTitle) {
        setTitle(nextTitle);
      }
      return { imageUrl, title: nextTitle };
    } catch {
      return { imageUrl: existingImage, title: existingTitle };
    } finally {
      setPreviewBusy(false);
    }
  }, [url, setImageHint, setTitle]);

  const resetPreviewTracking = useCallback(() => {
    autoImageRef.current = null;
    lastUrlRef.current = null;
    setPreviewMiss(false);
  }, []);

  return {
    previewBusy,
    previewMiss,
    ensurePreview,
    resetPreviewTracking,
  };
}
