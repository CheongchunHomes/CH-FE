import type { MapListing } from "@/lib/map/map-types";

type MapListingCardProps = {
  item: MapListing;
  onClick?: (item: MapListing) => void;
};

export default function MapListingCard({ item, onClick }: MapListingCardProps) {
  const tags = Array.isArray(item.tag) ? item.tag : [];

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex gap-3">
        {/* 매물 썸네일 영역입니다. */}
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-200" />
        )}

        <div className="min-w-0 flex-1">
          {/* 매물 제목을 표시합니다. */}
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900">
            {item.title}
          </h3>

          {/* 보증금과 월세 정보를 표시합니다. */}
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {item.depositLabel}
            {item.monthlyRentLabel ? ` / ${item.monthlyRentLabel}` : ""}
          </p>

          {/* 관리비를 표시합니다. */}
          {item.maintenanceFee !== null && item.maintenanceFee !== undefined && (
            <p className="mt-1 text-xs text-slate-500">
              관리비 {item.maintenanceFee}만
            </p>
          )}

          {/* 주소 정보를 표시합니다. */}
          <p className="mt-1 text-xs text-slate-500">{item.address}</p>

          {/* 백엔드에서 받은 tag 배열을 뱃지로 표시합니다. */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}