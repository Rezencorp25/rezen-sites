"use client";

type Props = {
  title: string;
  description: string;
  image?: string;
  url: string;
  variant: "facebook" | "twitter";
};

export function SocialPreview({ title, description, image, url, variant }: Props) {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0];
  const safeTitle = title || "Titolo Open Graph";
  const safeDesc =
    description || "Descrizione mostrata quando il link è condiviso sui social.";

  if (variant === "twitter") {
    return (
      <div className="overflow-hidden rounded-2xl border border-outline/30 bg-surface-container-low">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" className="aspect-[2/1] w-full object-cover" />
        ) : (
          <div className="aspect-[2/1] w-full bg-gradient-to-br from-surface-container-high to-surface-container-highest" />
        )}
        <div className="border-t border-outline/30 px-4 py-3">
          <p className="text-label-sm uppercase tracking-wider text-text-muted">{domain}</p>
          <p className="mt-1 line-clamp-1 text-body-md font-semibold text-on-surface">
            {safeTitle}
          </p>
          <p className="mt-1 line-clamp-2 text-body-sm text-secondary-text">{safeDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline/30 bg-surface-container-low">
      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" />
      ) : (
        <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-surface-container-high to-surface-container-highest" />
      )}
      <div className="border-t border-outline/30 px-4 py-3">
        <p className="text-label-sm uppercase tracking-wider text-text-muted">{domain}</p>
        <p className="mt-1 line-clamp-2 text-body-md font-semibold text-on-surface">
          {safeTitle}
        </p>
        <p className="mt-1 line-clamp-2 text-body-sm text-secondary-text">{safeDesc}</p>
      </div>
    </div>
  );
}
