'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenSquare, MapPin } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const REGIONS = {
  seoul: {
    name: '서울특별시',
    districts: ['강남구', '서초구', '마포구', '송파구', '용산구'],
  },
  gyeonggi: {
    name: '경기도',
    districts: ['수원시', '성남시', '고양시', '용인시', '안양시'],
  },
  incheon: {
    name: '인천광역시',
    districts: ['부평구', '남동구', '연수구', '미추홀구'],
  },
};

type CityKey = keyof typeof REGIONS;

export default function CommunityWritePage() {
  const router = useRouter();

  const [selectedCity, setSelectedCity] = useState<CityKey | ''>('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCity || !selectedDistrict || !title || !content) {
      return;
    }

    try {
      setLoading(true);

      const region = `${REGIONS[selectedCity].name} ${selectedDistrict}`;

      const response = await fetch('/api/community/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1,
          region,
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('등록 실패');
      }
      router.push('/site/community');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
            <PenSquare size={16} />
            동네 커뮤니티 글쓰기
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            새 글 작성
          </h1>

          <p className="mt-2 text-slate-500">
            우리 동네에 필요한 정보와 이야기를 공유해보세요.
          </p>
        </div>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-6 p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value as CityKey);
                  setSelectedDistrict('');
                }}
                className="h-14 rounded-2xl border border-slate-200 px-4"
              >
                <option value="">시/도 선택</option>
                {Object.entries(REGIONS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity}
                className="h-14 rounded-2xl border border-slate-200 px-4"
              >
                <option value="">구/군 선택</option>
                {selectedCity &&
                  REGIONS[selectedCity].districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
              </select>
            </div>

            <Input
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-14 rounded-2xl"
            />

            <textarea
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[250px] w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-[#2196F3]"
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl"
              >
                취소
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-xl bg-[#2196F3] hover:bg-[#1976D2]"
              >
                <MapPin size={16} className="mr-2" />
                {loading ? '등록 중...' : '등록하기'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}