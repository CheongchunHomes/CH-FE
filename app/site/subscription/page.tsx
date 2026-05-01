"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AnnouncementItem = {
  id: number;
  type: string;
  title: string;
  region: string;
  date: string;
  status: string;
  address: string;
  recruitmentType: string;
  sourceType: string;
};

const categoryMap = {
  special: "APT_SPECIAL",
  first: "APT_FIRST",
  second: "APT_SECOND",
  remain: "APT_REMAIN",
};

export default function SubscriptionPage() {
  return (
    <div className="w-full p-6">
      <Tabs defaultValue="apt" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="apt">APT</TabsTrigger>
          <TabsTrigger value="office">
            오피스텔 / 생숙 / 도시형 / 민간임대
          </TabsTrigger>
          <TabsTrigger value="public">공공지원 민간임대</TabsTrigger>
        </TabsList>

        <TabsContent value="apt" className="mt-6">
          <AptInnerTabs />
        </TabsContent>

        <TabsContent value="office" className="mt-6">
          <EmptyBox text="현재 표시할 공고가 없습니다." />
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <EmptyBox text="현재 표시할 공고가 없습니다." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AptInnerTabs() {
  const [activeTab, setActiveTab] = useState("special");
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const recruitmentType = categoryMap[activeTab as keyof typeof categoryMap];
    fetchAnnouncements(recruitmentType);
  }, [activeTab]);

  async function fetchAnnouncements(recruitmentType: string) {
    setLoading(true);

 try {
  const response = await fetch(
    `/api/announcements?recruitmentType=${recruitmentType}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();
  setItems(data);
} catch (error) {
  console.error("공고 조회 실패:", error);
  setItems([]);
} finally {
  setLoading(false);
}
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
        {item.status}
      </div>

      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p>대상: {item.type}</p>
        <p>지역: {item.region}</p>
        <p>접수일: {item.date}</p>
        <p>주소: {item.address}</p>
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