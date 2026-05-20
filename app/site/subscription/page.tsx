"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, get } from "@/lib/api";

type MainCategory = "apt" | "office" | "public";
type SubCategory = "special" | "first" | "second" | "remain";

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

const mainCategoryMap: Record<
  MainCategory,
  {
    label: string;
    recruitmentType?: string;
  }
> = {
  apt: {
    label: "APT",
    recruitmentType: "아파트",
  },
  office: {
    label: "오피스텔 / 생숙 / 도시형 / 민간임대",
    recruitmentType: "도시형/오피스텔/생활숙박시설/민간임대",
  },
  public: {
    label: "공공지원 민간임대",
    // TODO: 현재 CSV 기준으로 공공지원 민간임대와 정확히 매칭되는 recuitment_type 값 확인 필요
    recruitmentType: undefined,
  },
};

const subCategoryMap: Record<
  SubCategory,
  {
    label: string;
    applyType: string;
  }
> = {
  special: {
    label: "APT 특별공급",
    applyType: "SPECIAL",
  },
  first: {
    label: "APT 1순위",
    applyType: "FIRST",
  },
  second: {
    label: "APT 2순위",
    applyType: "SECOND",
  },
  remain: {
    label: "APT 잔여세대",
    applyType: "REMAIN",
  },
};

export default function SubscriptionPage() {
  const [mainCategory, setMainCategory] = useState<MainCategory>("apt");
  const [subCategory, setSubCategory] = useState<SubCategory>("special");
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [mainCategory, subCategory]);

  async function fetchAnnouncements() {
    const recruitmentType = mainCategoryMap[mainCategory].recruitmentType;

    console.log("[청약 공고 조회 조건]", {
      mainCategory,
      subCategory,
      recruitmentType,
      applyType: subCategoryMap[subCategory].applyType,
      // TODO: 백엔드에서 2차 카테고리 컬럼이 확정되면 applyType도 query에 연결
    });

    if (!recruitmentType) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const data = await get<AnnouncementItem[]>("/api/subscription", {
        query: {
          recruitmentType,
        },
        cache: "no-store",
      });

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

  return (
    <div className="w-full p-6">
      <Tabs
        value={mainCategory}
        onValueChange={(value) => {
          setMainCategory(value as MainCategory);
          setSubCategory("special");
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apt">APT</TabsTrigger>
          <TabsTrigger value="office">
            오피스텔 / 생숙 / 도시형 / 민간임대
          </TabsTrigger>
          <TabsTrigger value="public">공공지원 민간임대</TabsTrigger>
        </TabsList>

        <TabsContent value="apt" className="mt-6">
          <AptInnerTabs
            activeTab={subCategory}
            onTabChange={setSubCategory}
            items={items}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="office" className="mt-6">
          {loading ? (
            <EmptyBox text="공고를 불러오는 중입니다." />
          ) : (
            <AnnouncementList items={items} />
          )}
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <EmptyBox text="현재 CSV/백엔드 기준으로 연결할 모집유형 확인이 필요합니다." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AptInnerTabs({
  activeTab,
  onTabChange,
  items,
  loading,
}: {
  activeTab: SubCategory;
  onTabChange: (value: SubCategory) => void;
  items: AnnouncementItem[];
  loading: boolean;
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as SubCategory)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="special">APT 특별공급</TabsTrigger>
        <TabsTrigger value="first">APT 1순위</TabsTrigger>
        <TabsTrigger value="second">APT 2순위</TabsTrigger>
        <TabsTrigger value="remain">APT 잔여세대</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-5">
        {loading ? (
          <EmptyBox text="공고를 불러오는 중입니다." />
        ) : (
          <AnnouncementList items={items} />
        )}
      </TabsContent>
    </Tabs>
  );
}

function AnnouncementList({ items }: { items: AnnouncementItem[] }) {
  if (items.length === 0) {
    return <EmptyBox text="청약가능한 공고가 없습니다." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <AnnouncementCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const router = useRouter();

  const goDetailPage = () => {
    router.push(`/site/subscription/${item.id}`);
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        {item.status ?? "상태 미정"}
      </div>

      <h3 className="line-clamp-2 text-lg font-bold text-gray-900">
        {item.title}
      </h3>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>대상: {item.type ?? "-"}</p>
        <p>지역: {item.region ?? "-"}</p>
        <p>
          접수일: {item.applyStartDate ?? "-"} ~ {item.applyEndDate ?? "-"}
        </p>
        <p className="line-clamp-2">주소: {item.address ?? "-"}</p>
      </div>

      <button
        type="button"
        onClick={goDetailPage}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        상세 보기
      </button>
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