'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  HelpCircle,
  Wallet,
  Home,
  User,
  AlertCircle,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

function FaqPageContent() {
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState('전체');

  useEffect(() => {
    setSearchTerm(searchParams.get('q') ?? '');
  }, [searchParams]);

  const faqList: FaqItem[] = [
    {
      id: '1',
      category: '주거지원',
      question: '청년 전용 버팀목 전세자금대출 조건이 어떻게 되나요?',
      answer:
        '만 19세 이상 만 34세 이하의 무주택 세대주가 주요 대상입니다. 일반적으로 소득, 자산, 보증금, 전용면적 조건을 함께 확인해야 하며, 세부 기준은 모집 시점과 기관 안내에 따라 달라질 수 있습니다.',
    },
    {
      id: '2',
      category: '주거지원',
      question: '특별공급과 공공임대는 어떤 차이가 있나요?',
      answer:
        '특별공급은 집을 사기 위한 청약 기회에 가깝고, 공공임대는 집을 소유하지 않고 일정 기간 빌려 사는 제도입니다. 특별공급은 분양, 공공임대는 거주 안정에 초점이 있습니다.',
    },
    {
      id: '3',
      category: '주거지원',
      question: '청년매입임대와 청년전세임대는 어떻게 다른가요?',
      answer:
        '청년매입임대는 공공기관이 이미 매입한 집을 청년에게 임대하는 방식입니다. 청년전세임대는 청년이 살 집을 찾으면 공공기관이 전세 계약을 지원하는 방식입니다.',
    },
    {
      id: '4',
      category: '가계부',
      question: '가계부 서비스는 어떻게 이용하나요?',
      answer:
        '가계부 메뉴에서 지출입력을 통해 금액, 카테고리, 결제수단, 메모를 저장할 수 있습니다. 지출조회에서는 월별 지출 내역을 확인하고, 월별조회에서는 월 단위 통계를 볼 수 있습니다.',
    },
    {
      id: '5',
      category: '가계부',
      question: '입력한 지출 내역이 새로고침하면 사라져요.',
      answer:
        '새로고침 후 사라진다면 DB 저장이 되지 않은 상태일 수 있습니다. 백엔드 서버 실행 여부, API 주소, 저장 요청 POST 연결, DB 테이블 구조를 확인해야 합니다.',
    },
    {
      id: '6',
      category: '커뮤니티',
      question: '커뮤니티 글은 어떻게 작성하나요?',
      answer:
        '동네 커뮤니티 메뉴에서 새 글 쓰기를 누른 뒤 지역, 제목, 내용을 입력하고 등록하면 됩니다. 등록된 글은 목록에서 확인할 수 있습니다.',
    },
    {
      id: '7',
      category: '계정',
      question: '로그인은 어떻게 하나요?',
      answer:
        '우측 상단의 로그인 버튼을 클릭한 뒤, 제공되는 인증 방식으로 로그인할 수 있습니다. 팀 프로젝트 설정에 따라 구글 로그인 또는 자체 로그인이 적용될 수 있습니다.',
    },
    {
      id: '8',
      category: '계정',
      question: '회원탈퇴는 어떻게 하나요?',
      answer:
        '마이페이지 또는 설정 메뉴에서 회원탈퇴 기능을 이용할 수 있습니다. 탈퇴 시 작성한 게시글, 저장 데이터 처리 방식은 서비스 정책에 따라 달라질 수 있습니다.',
    },
    {
      id: '9',
      category: '공지',
      question: '공지사항은 어디서 확인하나요?',
      answer:
        '공지사항 메뉴에서 서비스 업데이트, 점검 안내, 정책 변경 사항 등을 확인할 수 있습니다.',
    },
  ];

  const categories = ['전체', '주거지원', '가계부', '커뮤니티', '계정', '공지', '기타'];

  const filteredFaqs = faqList.filter((faq) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      faq.question.toLowerCase().includes(keyword) ||
      faq.answer.toLowerCase().includes(keyword) ||
      faq.category.toLowerCase().includes(keyword);

    const matchesCategory =
      selectedCategory === '전체' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    if (category === '주거지원') return <Home size={14} />;
    if (category === '가계부') return <Wallet size={14} />;
    if (category === '계정') return <User size={14} />;
    return <HelpCircle size={14} />;
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
            <HelpCircle size={16} />
            청년홈즈 도움말
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            자주하는 질문
          </h1>

          <p className="mt-2 text-slate-500">
            청년홈즈 이용 중 자주 묻는 질문을 한눈에 확인하세요.
          </p>
        </div>

        <div className="relative mb-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="질문, 답변, 카테고리로 검색하세요"
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

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={`item-${faq.id}`}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <AccordionTrigger className="py-5 text-left text-slate-700 hover:text-[#2196F3]">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]">
                        <span className="mr-1 flex items-center">
                          {getCategoryIcon(faq.category)}
                        </span>
                        {faq.category}
                      </Badge>

                      <span className="font-semibold">{faq.question}</span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="rounded-2xl bg-[#F8FBFF] p-5 leading-relaxed text-slate-600">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertCircle className="mb-3" size={34} />
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-[#E3F2FD] bg-white p-5 text-sm text-slate-500">
          <strong className="text-[#2196F3]">안내</strong>
          <p className="mt-1">
            주거 제도와 대출 조건은 공고 시기, 지역, 기관에 따라 달라질 수
            있으므로 실제 신청 전 공식 공고문을 꼭 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={null}>
      <FaqPageContent />
    </Suspense>
  )
}
