'use client';

import { Button } from '@/components/ui/button';

interface Recoentity {
  id: number;
  name: string;
  category: string;
  minAge: number;
  maxAge: number;
  maxIncome: number;
  region: string;
  description: string;
  applyUrl: string;
  active: boolean;
}

interface Props {
  policy: Recoentity;
  isLast: boolean;
  onDetail: () => void;
}

export default function PolicyCard({ policy, isLast, onDetail }: Props) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        isLast ? '' : 'border-b border-gray-100'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">{policy.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {policy.region} · {policy.minAge}~{policy.maxAge}세 · 소득 {Math.round(policy.maxIncome / 10_000_000)}천만원 이하
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="ml-3 shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        onClick={onDetail}
      >
        상세보기
      </Button>
    </div>
  );
}