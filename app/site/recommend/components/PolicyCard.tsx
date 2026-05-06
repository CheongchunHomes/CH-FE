'use client';

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
  borderColor: string;
  onDetail: () => void; // 상세보기 클릭 시 모달 열기
}

export default function PolicyCard({ policy, isLast, borderColor, onDetail }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid #F3F4F6',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: borderColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>{policy.name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {policy.region} · {policy.minAge}~{policy.maxAge}세 · 소득 {Math.round(policy.maxIncome / 10000000)}천만원 이하
          </div>
        </div>
      </div>
      <button
        onClick={onDetail}
        style={{
          fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 8,
          border: '0.5px solid #1976D2', color: '#1976D2', background: 'transparent',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        상세보기
      </button>
    </div>
  );
}