// components/report/sections/PropertyImages.tsx
// Property images (report spec section 10). Two reserved slots. A present image
// renders in a bordered frame, lazy-loaded. An absent one renders a quiet dashed
// slot with a mono caption, no error tone, just reserved space.
import { Panel } from "@/components/primitives/Panel";
import type { ReportImage } from "@/lib/types";

const SLOT_CAPTION: Record<ReportImage["slot"], string> = {
  propertyPhoto: "Property Photo",
  aerialSiteMap: "Aerial / Site Map",
};

function Slot({ image }: { image: ReportImage }) {
  if (image.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt}
        loading="lazy"
        className="h-56 w-full rounded-sm border border-hairline object-cover"
      />
    );
  }
  return (
    <div className="flex h-56 items-center justify-center rounded-sm border border-dashed border-hairline-strong">
      <span className="font-mono text-caption uppercase tracking-[0.1em] text-faint">
        {SLOT_CAPTION[image.slot]}
      </span>
    </div>
  );
}

export function PropertyImages({ images }: { images: ReportImage[] }) {
  return (
    <Panel eyebrow="Property" title="Images">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {images.map((image) => (
          <Slot key={image.slot} image={image} />
        ))}
      </div>
    </Panel>
  );
}
