"use client";

import { useParams, useRouter } from "next/navigation";

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          상세페이지 연결 성공
        </h1>

        <p className="mt-4 text-center text-gray-600">
          현재 공고 ID: {params.id}
        </p>

        <p className="mt-2 text-center text-gray-600">
          상세보기 버튼을 눌러 이 화면이 나오면 연결이 성공한 것입니다.
        </p>

        <img
          src="/images/page-sample/청약공고디테일.png"
          alt="청약 공고 상세 샘플 이미지"
          className="mt-8 w-full max-w-3xl rounded-xl border shadow-sm"
        />

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white"
        >
          뒤로가기
        </button>
      </div>
    </main>
  );
}