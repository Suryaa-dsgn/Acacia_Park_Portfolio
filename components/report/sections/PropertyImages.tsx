"use client";
// components/report/sections/PropertyImages.tsx
// Property images (report spec section 10), now uploadable in-app. Each slot
// either shows the governed image, a locally uploaded one, or an empty dashed
// frame that accepts a file. Uploads are read as data URLs and persisted to
// localStorage scoped to this property and quarter (lib/localStore); they stay in
// the browser and are never sent anywhere. Stored images apply only after mount
// so the server and first client render match.
import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/primitives/Panel";
import { loadEdits, saveEdits, type ReportEdits } from "@/lib/localStore";
import type { ReportImage } from "@/lib/types";

const SLOT_CAPTION: Record<ReportImage["slot"], string> = {
  propertyPhoto: "Property Photo",
  aerialSiteMap: "Aerial / Site Map",
};

const EMPTY: ReportEdits = { narrative: {}, images: {}, markedFinal: false };

export function PropertyImages({
  images,
  propertyId,
  quarter,
}: {
  images: ReportImage[];
  propertyId: string;
  quarter: string;
}) {
  const [edits, setEdits] = useState<ReportEdits>(EMPTY);

  useEffect(() => {
    setEdits(loadEdits(propertyId, quarter));
  }, [propertyId, quarter]);

  function setImage(slot: string, dataUrl: string | null) {
    const nextImages = { ...edits.images };
    if (dataUrl) nextImages[slot] = dataUrl;
    else delete nextImages[slot];
    const next = { ...edits, images: nextImages };
    setEdits(next);
    saveEdits(propertyId, quarter, next);
  }

  return (
    <Panel eyebrow="Property" title="Images">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {images.map((image) => (
          <Slot
            key={image.slot}
            image={image}
            uploadedUrl={edits.images[image.slot] ?? null}
            onUpload={(url) => setImage(image.slot, url)}
            onClear={() => setImage(image.slot, null)}
          />
        ))}
      </div>
    </Panel>
  );
}

function Slot({
  image,
  uploadedUrl,
  onUpload,
  onClear,
}: {
  image: ReportImage;
  uploadedUrl: string | null;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const url = uploadedUrl ?? image.url;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }
    // Keep localStorage within quota: cap uploads at ~2MB.
    if (file.size > 2_000_000) {
      setError("Image is too large (2MB max)");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onUpload(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      {url ? (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={image.alt}
            loading="lazy"
            className="h-56 w-full rounded-sm border border-hairline object-cover"
          />
          {uploadedUrl && (
            <button
              onClick={onClear}
              className="no-print absolute right-2 top-2 rounded-sm border border-hairline-strong bg-panel-raised px-2 py-1 font-mono text-caption uppercase tracking-[0.08em] text-muted opacity-0 transition-opacity hover:text-text-serif group-hover:opacity-100"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="no-print flex h-56 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-hairline-strong transition-colors hover:border-accent"
        >
          <span className="font-mono text-caption uppercase tracking-[0.1em] text-faint">
            {SLOT_CAPTION[image.slot]}
          </span>
          <span className="font-sans text-caption text-muted">Click to upload an image</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {error && <p className="font-sans text-caption text-neg">{error}</p>}
    </div>
  );
}
