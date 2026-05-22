"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, get } from "@/lib/api";

type MainCategory = "apt" | "office" | "public";

type AnnouncementItem = {
  id: number;
  type: string | null;
  title: string;
  region: string | null;
  applyStartDate: string | null;
  applyEndDate: string | null;
  status: string | null;
  address: string | null;
  recruitmentType: string | null;
  sourceType: string | null;
};

const categories: {
  value: MainCategory;
  label: string;
}[] = [
  {
    value: "apt",
    label: "APT",
  },
  {
    value: "office",
    label: "오피스텔 / 생숙 / 도시형 / 민간임대",
  },
  {
    value: "public",
    label: "공공분양 / 공공임대",
  },
];

export default function SubscriptionPage() {
  const router = useRouter();

  const [mainCategory, setMainCategory] = useState<MainCategory>("apt");
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements(mainCategory);
  }, [mainCategory]);

  async function fetchAnnouncements(category: MainCategory) {
    console.log("[청약 공고 조회 요청]", category);

    setLoading(true);

    try {
      const data = await get<AnnouncementItem[]>("/api/subscription", {
        query: {
          category,
        },
        cache: "no-store",
      });

      console.log("[청약 공고 조회 결과]", category, data.length);

      setItems(data);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("청약 공고 조회 실패:", error.status, error.message);
      } else {
        console.error("청약 공고 조회 실패:", error);
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const goDetailPage = (id: number) => {
    router.push(`/site/subscription/${id}`);
  };

  return (
    <div className="w-full p-6">
      <div className="grid w-full grid-cols-3 rounded-lg bg-slate-100 p-1">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setMainCategory(category.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mainCategory === category.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <EmptyBox text="공고를 불러오는 중입니다." />
        ) : items.length === 0 ? (
          <EmptyBox text="청약가능한 공고가 없습니다." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item.status ?? "상태 미정"}
                </div>

                <h3 className="line-clamp-2 text-lg font-bold text-gray-900">
                  {item.title}
                </h3>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>출처: {item.sourceType ?? "-"}</p>
                  <p>유형: {item.recruitmentType ?? item.type ?? "-"}</p>
                  <p>지역: {item.region ?? "-"}</p>
                  <p>
                    접수일: {item.applyStartDate ?? "-"} ~{" "}
                    {item.applyEndDate ?? "-"}
                  </p>
                  <p className="line-clamp-2">주소: {item.address ?? "-"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => goDetailPage(item.id)}
                  className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  상세 보기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-500">
      {text}
    </div>
  );
}