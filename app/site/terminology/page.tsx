'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Home,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface PolicyGuide {
  title: string;
  category: string;
  target: string;
  simpleDescription: string;
  detailDescription: string;
  example: string;
  checklist: string[];
  caution: string;
}

export default function PolicyGuidePage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');

  const guides: PolicyGuide[] = [
    {
      title: '특별공급',
      category: '특공',
      target: '신혼부부, 청년, 다자녀, 생애최초 무주택자',
      simpleDescription: '일반 청약과 별도로 정책 대상자에게 주는 주택 공급 기회',
      detailDescription:
        '특별공급은 일반공급과 따로 물량을 배정하여 정책적 배려가 필요한 사람에게 청약 기회를 제공하는 제도입니다.',
      example: '예: 생애 처음 집을 마련하려는 청년이 생애최초 특별공급에 신청',
      checklist: ['나이', '소득', '자산', '무주택 여부', '세대 구성', '거주 지역'],
      caution: '공고마다 조건이 다르며, 부적격 시 당첨이 취소될 수 있습니다.',
    },
    {
      title: '신혼부부 특별공급',
      category: '특공',
      target: '혼인 기간 기준을 충족한 신혼부부',
      simpleDescription: '신혼부부의 내 집 마련을 돕는 특별공급',
      detailDescription:
        '혼인 기간, 자녀 여부, 소득 기준 등을 바탕으로 신혼부부에게 별도 청약 기회를 제공합니다.',
      example: '예: 결혼 2년 차 무주택 부부가 신혼부부 특별공급에 신청',
      checklist: ['혼인 기간', '소득', '무주택 여부', '자녀 수'],
      caution: '혼인신고일 기준과 세대원 주택 소유 여부를 확인해야 합니다.',
    },
    {
      title: '생애최초 특별공급',
      category: '특공',
      target: '주택 소유 이력이 없는 무주택자',
      simpleDescription: '처음 집을 사는 사람을 위한 특별공급',
      detailDescription:
        '본인과 세대 구성원의 주택 소유 이력을 기준으로 판단하며, 첫 내 집 마련을 지원하는 제도입니다.',
      example: '예: 부모님 집에 살다가 처음 본인 명의로 청약하는 경우',
      checklist: ['주택 소유 이력', '소득', '무주택 여부'],
      caution: '본인뿐 아니라 세대 구성원 기준도 함께 검토될 수 있습니다.',
    },
    {
      title: '청년 특별공급',
      category: '특공',
      target: '청년, 사회초년생',
      simpleDescription: '청년층 내 집 마련을 돕는 특별공급',
      detailDescription:
        '청년의 주거 안정과 자산 형성을 위해 일부 공공분양이나 정책 주택에서 제공되는 제도입니다.',
      example: '예: 만 29세 무주택 사회초년생이 청년 특별공급 신청',
      checklist: ['나이', '소득', '무주택 여부', '지역 조건'],
      caution: '공고별 연령 기준과 소득 기준이 다를 수 있습니다.',
    },
    {
      title: '공공임대',
      category: '공공임대',
      target: '청년, 신혼부부, 저소득층',
      simpleDescription: '공공기관이 시세보다 저렴하게 제공하는 임대주택',
      detailDescription:
        'LH, SH 등 공공기관이 공급하며 보증금과 월세 부담을 줄여주는 임대주택입니다.',
      example: '예: 사회초년생이 LH 공공임대주택에 입주',
      checklist: ['소득', '자산', '무주택 여부', '공고 일정'],
      caution: '거주 기간 제한과 자산 기준이 있을 수 있습니다.',
    },
    {
      title: '행복주택',
      category: '청년임대',
      target: '청년, 대학생, 신혼부부',
      simpleDescription: '교통이 편리한 지역 중심의 청년·신혼부부 공공임대',
      detailDescription:
        '직장이나 학교와 가까운 곳에 공급되는 경우가 많아 청년층 주거비 부담을 줄이는 데 도움이 됩니다.',
      example: '예: 대학생이 학교 근처 행복주택에 신청',
      checklist: ['나이', '소득', '재학 여부', '무주택 여부'],
      caution: '대상군별 조건이 다르므로 세부 공고 확인이 필요합니다.',
    },
    {
      title: '청년매입임대',
      category: '청년임대',
      target: '무주택 청년',
      simpleDescription: '공공기관이 매입한 기존 주택을 청년에게 재임대',
      detailDescription:
        '원룸, 다세대, 오피스텔 등을 공공기관이 매입해 청년에게 저렴하게 임대하는 제도입니다.',
      example: '예: 첫 자취를 시작하는 청년이 청년매입임대 입주',
      checklist: ['나이', '소득', '무주택 여부'],
      caution: '지역별 공급량과 경쟁률 차이가 큽니다.',
    },
    {
      title: '청년전세임대',
      category: '청년임대',
      target: '전세 보증금 부담이 큰 청년',
      simpleDescription: '원하는 집을 찾으면 공공기관이 전세 계약을 지원',
      detailDescription:
        '입주자가 살 집을 찾으면 공공기관이 집주인과 전세 계약을 맺고 청년에게 재임대하는 방식입니다.',
      example: '예: 청년이 원하는 원룸 전세를 LH 지원으로 계약',
      checklist: ['전세 보증금 한도', '소득', '주택 조건'],
      caution: '지원 가능 보증금 한도와 주택 조건을 확인해야 합니다.',
    },
    {
      title: '청년안심주택',
      category: '청년임대',
      target: '역세권 거주를 원하는 청년',
      simpleDescription: '교통 좋은 지역의 청년 대상 임대주택',
      detailDescription:
        '역세권 중심으로 공급되어 출퇴근과 통학 편의성이 높고, 공공형과 민간형이 함께 운영될 수 있습니다.',
      example: '예: 서울 역세권에서 출퇴근하는 청년이 신청',
      checklist: ['나이', '소득', '지역 조건'],
      caution: '인기 지역은 경쟁률이 높을 수 있습니다.',
    },
    {
      title: '국민임대',
      category: '공공임대',
      target: '무주택 저소득층',
      simpleDescription: '장기 거주 안정성을 위한 공공임대',
      detailDescription:
        '저렴한 임대료로 장기간 안정적으로 거주할 수 있도록 공급되는 공공임대주택입니다.',
      example: '예: 장기 주거가 필요한 무주택 가구가 신청',
      checklist: ['소득', '자산', '자동차 가액'],
      caution: '소득과 자산 기준을 초과하면 신청이 어려울 수 있습니다.',
    },
    {
      title: '공공분양',
      category: '분양',
      target: '무주택 실수요자',
      simpleDescription: '공공기관이 분양하는 주택',
      detailDescription:
        '공공기관이 공급하는 분양주택으로, 민간분양보다 가격 부담이 낮은 경우가 있습니다.',
      example: '예: 청년 또는 신혼부부가 공공분양 청약 신청',
      checklist: ['청약통장', '무주택 여부', '소득', '거주 의무'],
      caution: '전매 제한, 거주 의무, 분양가 조건을 확인해야 합니다.',
    },
    {
      title: '분양전환형 임대',
      category: '분양',
      target: '임대 거주 후 구매를 고민하는 사람',
      simpleDescription: '처음에는 임대, 이후 분양 전환 가능',
      detailDescription:
        '일정 기간 임대로 거주한 뒤 조건에 따라 분양 여부를 선택할 수 있는 주택 유형입니다.',
      example: '예: 10년 임대 후 분양 전환 여부를 결정',
      checklist: ['전환 시기', '분양가 기준', '거주 기간'],
      caution: '향후 분양가 부담이 커질 수 있습니다.',
    },
  ];

  const categories = ['전체', '특공', '공공임대', '청년임대', '분양'];

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const keyword = searchTerm.toLowerCase();

      const matchesSearch =
        guide.title.toLowerCase().includes(keyword) ||
        guide.category.toLowerCase().includes(keyword) ||
        guide.target.toLowerCase().includes(keyword) ||
        guide.simpleDescription.toLowerCase().includes(keyword) ||
        guide.detailDescription.toLowerCase().includes(keyword);

      const matchesCategory =
        selectedCategory === '전체' || guide.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    if (category === '특공') return <Users size={14} />;
    if (category === '공공임대') return <Building2 size={14} />;
    if (category === '청년임대') return <Home size={14} />;
    if (category === '분양') return <KeyRound size={14} />;
    return <Home size={14} />;
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
            <Home size={16} />
            청년홈즈 주거 제도 가이드
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            특공 · 임대 · 분양 제도 한눈에 보기
          </h1>

          <p className="mt-2 text-slate-500">
            특공은 집을 사기 위한 청약 기회, 임대는 빌려 사는 방식,
            분양은 실제 소유에 가까운 제도입니다.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[
            ['특공', '정책 대상자에게 주는 특별 청약 기회'],
            ['임대', '집을 소유하지 않고 일정 기간 거주'],
            ['분양', '청약 또는 구매를 통해 실제 소유 가능'],
          ].map(([title, desc]) => (
            <Card key={title} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <strong className="text-xl text-[#2196F3]">{title}</strong>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative mb-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="제도명, 대상, 설명으로 검색하세요"
            className="h-14 rounded-2xl border-slate-200 bg-white pl-12 shadow-sm focus-visible:ring-[#2196F3]"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-[#2196F3] text-white shadow-sm'
                  : 'bg-[#E3F2FD] text-[#2196F3] hover:bg-[#BBDEFB]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredGuides.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGuides.map((guide, index) => (
              <Card
                key={`${guide.title}-${index}`}
                className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge className="bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]">
                      <span className="mr-1 flex items-center">
                        {getCategoryIcon(guide.category)}
                      </span>
                      {guide.category}
                    </Badge>

                    <span className="text-xs font-bold text-slate-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h2 className="mb-2 text-xl font-bold text-slate-900">
                    {guide.title}
                  </h2>

                  <p className="mb-3 text-sm font-semibold text-[#1565C0]">
                    추천 대상: {guide.target}
                  </p>

                  <p className="mb-3 text-sm font-semibold leading-relaxed text-slate-800">
                    {guide.simpleDescription}
                  </p>

                  <p className="mb-4 text-sm leading-relaxed text-slate-500">
                    {guide.detailDescription}
                  </p>

                  <div className="mb-3 rounded-2xl bg-[#E3F2FD] p-4 text-sm text-[#0D47A1]">
                    <strong>예시</strong>
                    <p className="mt-1 leading-relaxed">{guide.example}</p>
                  </div>

                  <div className="mb-3 rounded-2xl bg-[#F1F8E9] p-4 text-sm text-slate-600">
                    <div className="mb-2 flex items-center gap-1 font-semibold text-[#2E7D32]">
                      <CheckCircle2 size={15} />
                      신청 전 확인사항
                    </div>

                    <ul className="list-disc space-y-1 pl-5">
                      {guide.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-[#FFF8E1] p-4 text-sm text-[#795548]">
                    <div className="mb-1 flex items-center gap-1 font-semibold">
                      <AlertCircle size={15} />
                      주의
                    </div>
                    <p className="leading-relaxed">{guide.caution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed bg-white py-20 text-center text-slate-400">
            검색 결과가 없습니다.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-[#E3F2FD] bg-white p-5 text-sm text-slate-500 shadow-sm">
          <strong className="text-[#2196F3]">안내</strong>
          <p className="mt-1 leading-relaxed">
            주택 제도는 지역, 공급 기관, 모집 공고 시기에 따라 조건이 달라질 수
            있으므로 실제 신청 전 반드시 LH, SH, 마이홈포털 또는 지자체
            공고문을 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}