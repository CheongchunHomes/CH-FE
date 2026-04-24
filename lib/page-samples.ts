export const pageSamples = [
  { label: "청약", slug: "subscription", image: "/images/page-sample/청약.png" },
  { label: "내 조건 진단", slug: "condition-check", image: "/images/page-sample/내 조건 진단.png" },
  { label: "공고", slug: "notice", image: "/images/page-sample/공고.png" },
  { label: "계약", slug: "contract", image: "/images/page-sample/계약.png" },
  { label: "가이드센터", slug: "guide-center", image: "/images/page-sample/가이드센터.png" },
  { label: "ai", slug: "ai", image: "/images/page-sample/ai.png" },
  { label: "마이페이지", slug: "my-page", image: "/images/page-sample/마이페이지.png" },
  { label: "대출", slug: "loan", image: "/images/page-sample/대출.png" },
  { label: "문의하기", slug: "contact", image: "/images/page-sample/문의하기.png" },
  { label: "시뮬레이터", slug: "simulator", image: "/images/page-sample/시뮬레이터.png" },
  { label: "자주 묻는 질문", slug: "faq", image: "/images/page-sample/자주 묻는 질문.png" },
  { label: "전월세", slug: "rent", image: "/images/page-sample/전월세.png" },
] as const

export type PageSample = (typeof pageSamples)[number]

export function getPageSample(slug: string): PageSample | undefined {
  return pageSamples.find((sample) => sample.slug === slug)
}

export function getPageSampleHref(slug: string) {
  return slug === "site" ? "/site" : `/site/${slug}`
}
