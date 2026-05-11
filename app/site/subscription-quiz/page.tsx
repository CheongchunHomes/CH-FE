
'use client';

import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CircleHelp,
  Home,
  RotateCcw,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type QuizCategory = '무주택' | '부양가족' | '청약통장' | '소득/자산' | '기본개념';

interface QuizQuestion {
  id: number;
  category: QuizCategory;
  question: React.ReactNode;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const QUESTION_LIMIT = 10;

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    category: '무주택',
    question: (
      <>
        청약 가점에서 <span className="text-red-500">무주택 기간</span>은 어떤 의미인가요?
      </>
    ),
    options: [
      '현재 집이 없는 기간만 의미한다',
      '월세로 산 기간만 의미한다',
      '세대 구성원 전체가 주택을 소유하지 않은 기간을 의미할 수 있다',
      '청약통장을 만든 기간을 의미한다',
    ],
    answerIndex: 2,
    explanation:
      '무주택 기간은 본인뿐 아니라 세대 구성원의 주택 소유 여부와 함께 판단될 수 있습니다. 공고마다 세부 기준을 꼭 확인해야 합니다.',
  },
  {
    id: 2,
    category: '부양가족',
    question: (
      <>
        청약 가점에서 <span className="text-red-500">부양가족 수</span>가 중요한 이유는 무엇인가요?
      </>
    ),
    options: [
      '부양가족 수는 청약과 전혀 관련이 없다',
      '부양가족 수가 많을수록 가점에 영향을 줄 수 있기 때문이다',
      '부양가족 수가 많으면 무조건 당첨된다',
      '부양가족 수는 월세 지원에만 쓰인다',
    ],
    answerIndex: 1,
    explanation:
      '부양가족 수는 청약 가점 항목 중 하나로 사용될 수 있습니다. 다만 가족관계와 주민등록상 세대 구성 기준을 함께 확인해야 합니다.',
  },
  {
    id: 3,
    category: '청약통장',
    question: (
      <>
        청약통장 <span className="text-red-500">가입 기간</span>은 왜 확인해야 하나요?
      </>
    ),
    options: [
      '가입 기간은 아무 의미가 없다',
      '가입 기간이 짧을수록 무조건 유리하다',
      '청약통장은 임대주택 신청에만 필요하다',
      '가입 기간이 길수록 청약 가점에 영향을 줄 수 있기 때문이다',
    ],
    answerIndex: 3,
    explanation:
      '청약통장 가입 기간은 청약 가점 산정에 활용될 수 있습니다. 가입 기간, 납입 횟수, 예치금 기준 등을 함께 확인하는 것이 좋습니다.',
  },
  {
    id: 4,
    category: '소득/자산',
    question: (
      <>
        특별공급이나 공공임대 신청 시 <span className="text-red-500">소득·자산 기준</span>을 확인해야 하는 이유는 무엇인가요?
      </>
    ),
    options: [
      '신청 자격을 판단하는 기준이 될 수 있기 때문이다',
      '소득과 자산은 절대 확인하지 않는다',
      '소득이 높을수록 항상 유리하기 때문이다',
      '자산 기준은 민간분양에만 적용된다',
    ],
    answerIndex: 0,
    explanation:
      '청년, 신혼부부, 공공임대 등 정책형 주거 제도는 소득과 자산 기준을 두는 경우가 많습니다.',
  },
  {
    id: 5,
    category: '기본개념',
    question: (
      <>
        <span className="text-red-500">특별공급</span>의 가장 가까운 설명은 무엇인가요?
      </>
    ),
    options: [
      '누구나 무조건 당첨되는 제도',
      '월세를 자동으로 지원하는 제도',
      '정책 대상자에게 별도 물량으로 제공되는 청약 기회',
      '집을 임대만 할 수 있는 제도',
    ],
    answerIndex: 2,
    explanation:
      '특별공급은 신혼부부, 생애최초, 다자녀, 청년 등 정책 대상자에게 일반공급과 별도로 제공되는 청약 기회입니다.',
  },
  {
    id: 6,
    category: '무주택',
    question: (
      <>
        <span className="text-red-500">무주택 여부</span>를 확인할 때 주의해야 할 점은 무엇인가요?
      </>
    ),
    options: [
      '본인만 확인하면 된다',
      '전세에 살면 무조건 유주택자다',
      '월세에 살면 무조건 청약 당첨이다',
      '세대 구성원의 주택 소유 여부도 함께 확인될 수 있다',
    ],
    answerIndex: 3,
    explanation:
      '무주택 여부는 본인뿐 아니라 세대 구성원 기준까지 함께 확인될 수 있으므로 공고의 판단 기준을 확인해야 합니다.',
  },
  {
    id: 7,
    category: '부양가족',
    question: (
      <>
        <span className="text-red-500">부양가족 수</span>를 판단할 때 가장 주의해야 할 것은 무엇인가요?
      </>
    ),
    options: [
      '친구도 부양가족에 포함된다',
      '실제로 함께 사는지와 주민등록상 세대 구성이 중요할 수 있다',
      '부양가족은 무조건 많게 적으면 된다',
      '부양가족은 청약통장 가입 기간과 같다',
    ],
    answerIndex: 1,
    explanation:
      '부양가족은 단순히 가족이라는 이유만으로 인정되는 것이 아니라, 주민등록상 세대 구성과 실제 부양 관계 기준을 확인해야 합니다.',
  },
  {
    id: 8,
    category: '청약통장',
    question: (
      <>
        청약 신청 전에 <span className="text-red-500">청약통장</span>에서 확인하면 좋은 항목은 무엇인가요?
      </>
    ),
    options: [
      '핸드폰 기종',
      '자주 쓰는 카드',
      '가입 기간, 납입 횟수, 예치금',
      '출퇴근 시간',
    ],
    answerIndex: 2,
    explanation:
      '청약통장은 가입 기간, 납입 횟수, 예치금 등이 중요하게 활용될 수 있습니다.',
  },
  {
    id: 9,
    category: '무주택',
    question: (
      <>
        <span className="text-red-500">무주택 기간 산정</span>에서 가장 조심해야 하는 것은 무엇인가요?
      </>
    ),
    options: [
      '핸드폰 요금 납부일',
      '출퇴근 거리',
      '공고별 기준일과 세대원 주택 소유 여부',
      '월세 금액',
    ],
    answerIndex: 2,
    explanation:
      '무주택 기간은 공고 기준일, 혼인 여부, 세대원 주택 소유 여부 등에 따라 달라질 수 있어 공고문 확인이 중요합니다.',
  },
  {
    id: 10,
    category: '부양가족',
    question: (
      <>
        <span className="text-red-500">부양가족으로 인정</span>받기 위해 확인해야 할 가능성이 높은 기준은 무엇인가요?
      </>
    ),
    options: [
      '주민등록상 세대 구성과 실제 부양 관계',
      '친구 관계',
      '자주 연락하는 사람 수',
      '같은 지역에 사는 지인 수',
    ],
    answerIndex: 0,
    explanation:
      '부양가족 인정 여부는 가족관계뿐 아니라 주민등록상 세대 구성, 실제 부양 여부 등이 중요하게 작용할 수 있습니다.',
  },
  {
    id: 11,
    category: '기본개념',
    question: (
      <>
        청약에서 <span className="text-red-500">일반공급</span>과 특별공급의 차이로 알맞은 것은 무엇인가요?
      </>
    ),
    options: [
      '일반공급은 추첨이 절대 없다',
      '특별공급은 특정 정책 대상자에게 별도 물량이 배정될 수 있다',
      '특별공급은 청약통장이 절대 필요 없다',
      '일반공급은 청년만 신청할 수 있다',
    ],
    answerIndex: 1,
    explanation:
      '특별공급은 신혼부부, 생애최초, 청년 등 정책 대상자에게 별도 물량을 배정하는 방식입니다.',
  },
  {
    id: 12,
    category: '소득/자산',
    question: (
      <>
        공공임대 신청에서 <span className="text-red-500">소득 기준</span>을 볼 때 가장 적절한 태도는 무엇인가요?
      </>
    ),
    options: [
      '공고문 기준을 확인하고 본인 가구 소득과 비교한다',
      '소득은 무조건 낮게 적으면 된다',
      '친구 소득까지 합산한다',
      '소득 기준은 당첨 후에만 확인한다',
    ],
    answerIndex: 0,
    explanation:
      '공공임대나 특별공급은 가구원 수와 소득 기준을 함께 보는 경우가 많으므로 공고문 기준 확인이 필요합니다.',
  },
  {
    id: 13,
    category: '청약통장',
    question: (
      <>
        청약통장 관련 기준에서 <span className="text-red-500">납입 횟수</span>가 중요한 경우는 언제인가요?
      </>
    ),
    options: [
      '항상 무조건 필요 없다',
      '일부 공공분양이나 임대주택에서 자격 또는 순위 판단에 활용될 수 있다',
      '자동차 보험료 계산에 사용된다',
      '부양가족 수를 계산할 때 사용된다',
    ],
    answerIndex: 1,
    explanation:
      '청약통장 납입 횟수는 일부 유형에서 신청 자격이나 순위 판단 요소로 활용될 수 있습니다.',
  },
  {
    id: 14,
    category: '무주택',
    question: (
      <>
        <span className="text-red-500">부모님 집에 같이 거주</span>하는 경우 무주택 판단에서 가장 먼저 확인할 것은 무엇인가요?
      </>
    ),
    options: [
      '집의 인테리어 색상',
      '부모님 차량 소유 여부',
      '세대 구성과 세대원의 주택 소유 여부',
      '본인의 휴대폰 요금제',
    ],
    answerIndex: 2,
    explanation:
      '부모님과 같은 세대인지, 세대원이 주택을 소유하고 있는지에 따라 무주택 판단이 달라질 수 있습니다.',
  },
  {
    id: 15,
    category: '기본개념',
    question: (
      <>
        청약 공고문에서 <span className="text-red-500">신청 자격</span>을 먼저 확인해야 하는 이유는 무엇인가요?
      </>
    ),
    options: [
      '신청 자격이 안 되면 접수해도 부적격이 될 수 있기 때문이다',
      '신청 자격은 당첨 후에 처음 본다',
      '신청 자격은 모든 공고가 완전히 같다',
      '신청 자격은 디자인 요소다',
    ],
    answerIndex: 0,
    explanation:
      '청약은 공고마다 신청 자격, 지역, 소득, 자산, 무주택 기준이 다를 수 있으므로 먼저 확인해야 합니다.',
  },
  {
    id: 16,
    category: '부양가족',
    question: (
      <>
        청약 가점에서 <span className="text-red-500">부양가족을 임의로 많이 입력</span>하면 어떻게 될 수 있나요?
      </>
    ),
    options: [
      '가점이 높아지므로 무조건 좋다',
      '아무 문제가 없다',
      '확인 과정에서 부적격 처리될 수 있다',
      '청약통장 가입 기간이 늘어난다',
    ],
    answerIndex: 2,
    explanation:
      '부양가족 수는 증빙과 기준에 맞아야 하며, 잘못 입력하면 부적격 문제가 생길 수 있습니다.',
  },
  {
    id: 17,
    category: '소득/자산',
    question: (
      <>
        <span className="text-red-500">자산 기준</span>에 포함될 수 있는 항목으로 가장 가까운 것은 무엇인가요?
      </>
    ),
    options: [
      '휴대폰 배경화면',
      '부동산, 자동차, 금융자산 등',
      '좋아하는 음식',
      'SNS 팔로워 수',
    ],
    answerIndex: 1,
    explanation:
      '자산 기준은 공고에 따라 부동산, 자동차, 금융자산 등을 종합적으로 확인할 수 있습니다.',
  },
  {
    id: 18,
    category: '청약통장',
    question: (
      <>
        청약통장 <span className="text-red-500">예치금 기준</span>은 왜 확인해야 하나요?
      </>
    ),
    options: [
      '신청하려는 지역과 주택형에 따라 필요한 금액이 다를 수 있기 때문이다',
      '예치금은 항상 0원이어야 한다',
      '예치금은 부양가족 수를 의미한다',
      '예치금은 신청 후 아무 때나 맞추면 된다',
    ],
    answerIndex: 0,
    explanation:
      '민영주택 등 일부 청약에서는 지역과 면적에 따라 필요한 예치금 기준이 달라질 수 있습니다.',
  },
  {
    id: 19,
    category: '기본개념',
    question: (
      <>
        청약에서 <span className="text-red-500">부적격</span>이 발생할 수 있는 상황은 무엇인가요?
      </>
    ),
    options: [
      '공고문을 꼼꼼히 읽은 경우',
      '자격 기준과 다르게 신청 정보를 입력한 경우',
      '정확한 서류를 제출한 경우',
      '신청 전에 조건을 확인한 경우',
    ],
    answerIndex: 1,
    explanation:
      '무주택, 소득, 자산, 부양가족 등 기준과 다르게 입력하면 부적격 문제가 발생할 수 있습니다.',
  },
  {
    id: 20,
    category: '무주택',
    question: (
      <>
        <span className="text-red-500">과거 주택 소유 이력</span>이 있는 경우 가장 적절한 행동은 무엇인가요?
      </>
    ),
    options: [
      '무조건 숨긴다',
      '공고 기준에 따라 무주택 기간 산정 방식을 확인한다',
      '청약통장을 해지한다',
      '부양가족 수를 줄인다',
    ],
    answerIndex: 1,
    explanation:
      '과거 주택 소유 이력이 있으면 언제부터 무주택 기간이 인정되는지 공고 기준을 확인해야 합니다.',
  },
];

const getRandomQuestions = () => {
  return [...quizQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, QUESTION_LIMIT);
};

const getCategoryIcon = (category: QuizCategory) => {
  if (category === '무주택') return <Home className="h-4 w-4" />;
  if (category === '부양가족') return <Users className="h-4 w-4" />;
  if (category === '청약통장') return <Wallet className="h-4 w-4" />;
  if (category === '소득/자산') return <Building2 className="h-4 w-4" />;

  return <CircleHelp className="h-4 w-4" />;
};

export default function SubscriptionQuizPage() {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(() =>
    getRandomQuestions()
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {}
  );
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = activeQuestions[currentIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  const score = useMemo(() => {
    return activeQuestions.reduce((total, question) => {
      return selectedAnswers[question.id] === question.answerIndex
        ? total + 1
        : total;
    }, 0);
  }, [activeQuestions, selectedAnswers]);

  const progressPercent = Math.round(
    ((currentIndex + 1) / activeQuestions.length) * 100
  );

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex === activeQuestions.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setActiveQuestions(getRandomQuestions());
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  const resultMessage =
    score >= 8
      ? '청약 가점 산정 기준을 아주 잘 이해하고 있어요.'
      : score >= 5
        ? '기본 개념은 잘 잡혀 있어요. 헷갈린 항목만 다시 보면 좋아요.'
        : '무주택, 부양가족, 청약통장 기준을 다시 학습해보는 것이 좋아요.';

  if (isFinished) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
        <section className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
              <Trophy className="h-4 w-4" />
              청약 기준 학습 결과
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              인터랙티브 퀴즈 결과
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              무주택 기간, 부양가족, 청약통장 등 청약 가점 산정 기준을 퀴즈로 학습해보세요.
            </p>
          </div>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-8">
              <div className="mb-8 rounded-3xl bg-[#2196F3] p-8 text-white">
                <p className="text-sm font-semibold text-white/80">나의 점수</p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-bold">{score}</span>
                  <span className="pb-2 text-xl font-semibold">
                    / {activeQuestions.length}점
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/90">
                  {resultMessage}
                </p>
              </div>

              <div className="space-y-4">
                {activeQuestions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrect = userAnswer === question.answerIndex;

                  return (
                    <Card
                      key={question.id}
                      className="rounded-2xl border-slate-200 bg-slate-50 shadow-none"
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="gap-1 bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]">
                            {getCategoryIcon(question.category)}
                            {question.category}
                          </Badge>

                          <Badge
                            className={
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                            }
                          >
                            {isCorrect ? '정답' : '오답'}
                          </Badge>
                        </div>

                        <h2 className="font-bold text-slate-900">
                          {index + 1}. {question.question}
                        </h2>

                        <p className="mt-3 text-sm text-slate-600">
                          내 답변:{' '}
                          <span className="font-semibold">
                            {question.options[userAnswer] ?? '미선택'}
                          </span>
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          정답:{' '}
                          <span className="font-semibold text-[#2196F3]">
                            {question.options[question.answerIndex]}
                          </span>
                        </p>

                        <p className="mt-3 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-600">
                          {question.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  className="gap-2 bg-[#2196F3] text-white hover:bg-[#1E88E5]"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  다시 풀기
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
            <CircleHelp className="h-4 w-4" />
            청약 기준 학습
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            인터랙티브 청약 가점 퀴즈
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            무주택 기간, 부양가족, 청약통장 등 청약 가점 산정 기준을 퀴즈로 학습해보세요.
          </p>
        </div>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge className="gap-1 bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]">
                  {getCategoryIcon(currentQuestion.category)}
                  {currentQuestion.category}
                </Badge>

                <CardTitle className="mt-4 text-xl text-slate-900">
                  문제 {currentIndex + 1}. {currentQuestion.question}
                </CardTitle>
              </div>

              <div className="text-sm font-semibold text-slate-400">
                {currentIndex + 1} / {activeQuestions.length}
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#2196F3] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAnswer(index)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition ${
                      isSelected
                        ? 'border-[#2196F3] bg-[#E3F2FD] text-[#2196F3]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="mr-2 font-bold text-slate-400">
                        {index + 1}.
                      </span>
                      {option}
                    </span>

                    {isSelected && <CheckCircle2 className="h-5 w-5" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={handlePrev}
              >
                이전
              </Button>

              <Button
                type="button"
                disabled={selectedAnswer === undefined}
                className="bg-[#2196F3] text-white hover:bg-[#1E88E5]"
                onClick={handleNext}
              >
                {currentIndex === activeQuestions.length - 1
                  ? '결과 보기'
                  : '다음 문제'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}