import type { MapListing } from "@/lib/map/map-types";

type MapListingCardProps = {
  item: MapListing;
};

export default function MapListingCard({ item }: MapListingCardProps) {
  return (
    <article className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-200" />

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">{item.title}</p>

          <p className="mt-1 text-sm text-slate-600">
            {item.depositLabel}
            {item.monthlyRentLabel && ` / ${item.monthlyRentLabel}`}
          </p>

          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {item.address}
          </p>

          <div className="mt-2 flex gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}