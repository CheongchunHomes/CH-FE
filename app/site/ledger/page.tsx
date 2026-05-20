'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  FileText,
  ListChecks,
  PieChart,
  Plus,
  Wallet,
} from 'lucide-react';

import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  expenditureId?: number;
  userId?: number;
  category: string;
  amount: number;
  method: string;
  memo: string;
  spentAt: string;
}

const CATEGORIES = ['전체', '식비', '교통', '저축', '기타'] as const;
const METHODS = ['카드', '현금', '쿠폰'] as const;

const isSavingCategory = (category: string) => category === '저축';

const getSignedAmount = (transaction: Transaction) => {
  const amount = Number(transaction.amount);

  if (isSavingCategory(transaction.category)) {
    return amount;
  }

  return -amount;
};

const formatSignedAmount = (amount: number) => {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${Math.abs(amount).toLocaleString()}원`;
};

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState<
    '지출조회' | '지출입력' | '월별조회'
  >('지출조회');

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [viewMonth, setViewMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [selectedCategory, setSelectedCategory] = useState('전체');

  const [formData, setFormData] = useState({
    spentAt: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    method: '카드',
    memo: '',
  });

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      const data = await get<Transaction[]>('/api/ledger', {
        cache: 'no-store',
      });

      setTransactions(data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(formData.amount);

    if (formData.amount === '' || !formData.category) {
      alert('금액과 카테고리를 입력하세요.');
      return;
    }

    if (amount < 0) {
      alert('금액은 0원 이상부터 입력할 수 있습니다.');
      return;
    }

    const newEntry = {
      category: formData.category,
      amount,
      method: formData.method,
      memo: formData.memo,
      spentAt: formData.spentAt,
    };

    try {
      const savedData = await post<Transaction>('/api/ledger', newEntry);

      setTransactions((prev) => [savedData, ...prev]);
      setViewMonth(formData.spentAt.slice(0, 7));
      setSelectedCategory('전체');
      setActiveTab('지출조회');

      setFormData({
        spentAt: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        method: '카드',
        memo: '',
      });

      alert('저장 완료');
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.spentAt && transaction.spentAt.startsWith(viewMonth)
    );
  }, [transactions, viewMonth]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === '전체') {
      return monthlyTransactions;
    }

    return monthlyTransactions.filter(
      (transaction) => transaction.category === selectedCategory
    );
  }, [monthlyTransactions, selectedCategory]);

  const displayTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, cur) => {
      return acc + getSignedAmount(cur);
    }, 0);
  }, [filteredTransactions]);

  const monthlySummary = useMemo(() => {
    const summaryTargetTransactions =
      selectedCategory === '전체'
        ? transactions
        : transactions.filter(
            (transaction) => transaction.category === selectedCategory
          );

    return summaryTargetTransactions.reduce((acc, cur) => {
      if (!cur.spentAt) return acc;

      const month = cur.spentAt.slice(0, 7);

      if (!acc[month]) {
        acc[month] = 0;
      }

      acc[month] += getSignedAmount(cur);

      return acc;
    }, {} as Record<string, number>);
  }, [transactions, selectedCategory]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-md bg-[#2196F3]/10 p-2 text-[#2196F3]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">가계부</h1>
              <p className="text-xs text-muted-foreground">
                청년홈즈 지출 관리
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              type="button"
              variant={activeTab === '지출조회' ? 'default' : 'ghost'}
              className={
                activeTab === '지출조회'
                  ? 'w-full justify-start bg-[#2196F3] text-white hover:bg-[#1E88E5]'
                  : 'w-full justify-start hover:bg-[#2196F3]/10 hover:text-[#2196F3]'
              }
              onClick={() => setActiveTab('지출조회')}
            >
              <ListChecks className="h-4 w-4" />
              지출조회
            </Button>

            <Button
              type="button"
              variant={activeTab === '지출입력' ? 'default' : 'ghost'}
              className={
                activeTab === '지출입력'
                  ? 'w-full justify-start bg-[#2196F3] text-white hover:bg-[#1E88E5]'
                  : 'w-full justify-start hover:bg-[#2196F3]/10 hover:text-[#2196F3]'
              }
              onClick={() => setActiveTab('지출입력')}
            >
              <Plus className="h-4 w-4" />
              지출입력
            </Button>

            <Button
              type="button"
              variant={activeTab === '월별조회' ? 'default' : 'ghost'}
              className={
                activeTab === '월별조회'
                  ? 'w-full justify-start bg-[#2196F3] text-white hover:bg-[#1E88E5]'
                  : 'w-full justify-start hover:bg-[#2196F3]/10 hover:text-[#2196F3]'
              }
              onClick={() => setActiveTab('월별조회')}
            >
              <PieChart className="h-4 w-4" />
              월별조회
            </Button>
          </nav>
        </aside>

        <div className="space-y-6">
          {activeTab === '지출입력' && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5 text-[#2196F3]" />
                  지출 정보 입력
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6">
                <form
                  onSubmit={handleSubmit}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">지출 일자</label>
                    <Input
                      name="spentAt"
                      type="date"
                      value={formData.spentAt}
                      onChange={handleInputChange}
                      className="focus-visible:ring-[#2196F3]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">금액</label>
                    <Input
                      name="amount"
                      type="number"
                      min={0}
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="예: 0"
                      className="focus-visible:ring-[#2196F3]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">카테고리</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2196F3] focus-visible:ring-offset-2"
                    >
                      <option value="">선택</option>
                      {CATEGORIES.filter((category) => category !== '전체').map(
                        (category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">결제 방식</label>
                    <select
                      name="method"
                      value={formData.method}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2196F3] focus-visible:ring-offset-2"
                    >
                      {METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">메모</label>
                    <Input
                      name="memo"
                      value={formData.memo}
                      onChange={handleInputChange}
                      placeholder="예: 점심 식사 / 적금"
                      className="focus-visible:ring-[#2196F3]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="w-full bg-[#2196F3] text-white hover:bg-[#1E88E5]"
                    >
                      저장하기
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === '지출조회' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-[#2196F3]" />
                  상세 내역
                </CardTitle>

                <Input
                  type="month"
                  value={viewMonth}
                  onChange={(event) => setViewMonth(event.target.value)}
                  className="w-[170px] focus-visible:ring-[#2196F3]"
                />
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-6 py-3 font-medium">날짜</th>
                        <th className="px-6 py-3 font-medium">카테고리</th>
                        <th className="px-6 py-3 font-medium">결제방식</th>
                        <th className="px-6 py-3 font-medium">메모</th>
                        <th className="px-6 py-3 text-right font-medium">
                          금액
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {monthlyTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-16 text-center text-muted-foreground"
                          >
                            내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        monthlyTransactions.map((transaction, index) => {
                          const signedAmount = getSignedAmount(transaction);
                          const isPositive = signedAmount >= 0;

                          return (
                            <tr
                              key={transaction.expenditureId ?? index}
                              className="border-b transition hover:bg-[#2196F3]/5"
                            >
                              <td className="px-6 py-4">
                                {transaction.spentAt}
                              </td>

                              <td className="px-6 py-4">
                                <Badge className="bg-[#2196F3]/10 text-[#2196F3] hover:bg-[#2196F3]/10">
                                  {transaction.category}
                                </Badge>
                              </td>

                              <td className="px-6 py-4">
                                {transaction.method}
                              </td>

                              <td className="px-6 py-4">
                                {transaction.memo || '-'}
                              </td>

                              <td
                                className={
                                  isPositive
                                    ? 'px-6 py-4 text-right font-bold text-blue-500'
                                    : 'px-6 py-4 text-right font-bold text-red-500'
                                }
                              >
                                {formatSignedAmount(signedAmount)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === '월별조회' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarDays className="h-5 w-5 text-[#2196F3]" />
                    {viewMonth} 통계 리포트
                  </CardTitle>

                  <Input
                    type="month"
                    value={viewMonth}
                    onChange={(event) => setViewMonth(event.target.value)}
                    className="w-[170px] focus-visible:ring-[#2196F3]"
                  />
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-[#2196F3]/20 bg-[#2196F3] text-white">
                      <CardContent className="p-6">
                        <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20">
                          {selectedCategory} 합계
                        </Badge>

                        <p className="text-3xl font-bold">
                          {formatSignedAmount(displayTotal)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-[#2196F3]/20 bg-[#2196F3] text-white">
                      <CardContent className="p-6">
                        <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20">
                          {selectedCategory} 건수
                        </Badge>

                        <p className="text-3xl font-bold">
                          {filteredTransactions.length}건
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold">
                      카테고리 선택조회
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((category) => {
                        const isActive = selectedCategory === category;

                        return (
                          <Button
                            key={category}
                            type="button"
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className={
                              isActive
                                ? 'bg-[#2196F3] text-white hover:bg-[#1E88E5]'
                                : 'border-[#2196F3]/30 text-[#2196F3] hover:bg-[#2196F3]/10 hover:text-[#2196F3]'
                            }
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg text-[#2196F3]">
                    {selectedCategory === '전체'
                      ? '전체 월별 합계'
                      : `${selectedCategory} 월별 합계`}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                          <th className="px-6 py-3 font-medium">월</th>
                          <th className="px-6 py-3 text-right font-medium">
                            {selectedCategory === '전체'
                              ? '총 합계'
                              : `${selectedCategory} 합계`}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {Object.entries(monthlySummary).length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-6 py-16 text-center text-muted-foreground"
                            >
                              내역이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          Object.entries(monthlySummary)
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([month, total]) => {
                              const isPositive = total >= 0;

                              return (
                                <tr
                                  key={month}
                                  className="border-b transition hover:bg-[#2196F3]/5"
                                >
                                  <td className="px-6 py-4">{month}</td>
                                  <td
                                    className={
                                      isPositive
                                        ? 'px-6 py-4 text-right font-bold text-blue-500'
                                        : 'px-6 py-4 text-right font-bold text-red-500'
                                    }
                                  >
                                    {formatSignedAmount(total)}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}