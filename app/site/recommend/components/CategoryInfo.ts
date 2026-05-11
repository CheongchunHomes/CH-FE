export const categoryInfo: Record<string, {
  title: string;
  desc: string;
  details: { label: string; value: string }[];
}> = {
  '공공임대': {
    title: '통합공공임대주택',
    desc: '국가나 지방자치단체의 재정이나 주택도시기금의 지원을 받아 사회취약계층 등의 주거안정을 목적으로 공급하는 임대주택입니다.',
    details: [
      { label: '임대기간', value: '30년 (2년 단위로 계약체결)' },
      { label: '전용면적', value: '85㎡ 이하' },
      { label: '임대조건', value: '보증금+임대료 (시중 시세의 35~90% 수준)' },
      { label: '입주자격', value: '무주택세대구성원으로 소득 및 자산 보유기준 충족' },
    ]
  },
  '민간분양': {
    title: '민간분양',
    desc: '민간 건설사가 공급하는 분양 주택으로 청약통장을 통해 신청할 수 있습니다.',
    details: [
      { label: '청약자격', value: '청약통장 가입자' },
      { label: '공급방식', value: '1순위/2순위 청약' },
    ]
  },
  '전세지원': {
    title: '전세지원',
    desc: '전세 보증금 마련이 어려운 분들을 위해 저금리로 전세자금을 대출해드리는 제도입니다.',
    details: [
      { label: '대출한도', value: '최대 2억 2천만원' },
      { label: '금리', value: '연 1~2%대' },
      { label: '대상', value: '무주택 세대주' },
    ]
  },
  '주거비지원': {
    title: '주거비지원',
    desc: '저소득층의 주거비 부담을 줄이기 위해 월세 등 주거비를 지원하는 제도입니다.',
    details: [
      { label: '지원금액', value: '월 최대 20만원' },
      { label: '대상', value: '기준 중위소득 48% 이하 가구' },
    ]
  },
  '금융지원': {
    title: '금융지원',
    desc: '주택 구입 또는 전세 자금 마련을 위한 저금리 대출 상품을 지원합니다.',
    details: [
      { label: '대출종류', value: '디딤돌대출, 보금자리론 등' },
      { label: '금리', value: '연 2~3%대' },
      { label: '대상', value: '무주택 또는 1주택 세대주' },
    ]
  },
};