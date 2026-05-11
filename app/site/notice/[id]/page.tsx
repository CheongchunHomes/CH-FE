import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
  Megaphone,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

type NoticeCategory =
  | '운영자 안내'
  | '정책 변경'
  | '점검'
  | '업데이트'
  | '약관 변경';

interface NoticeDetail {
  id: number;
  category: NoticeCategory;
  title: string;
  summary: string;
  date: string;
  views: number;
  important?: boolean;
  isNew?: boolean;
  content: string[];
}

const notices: NoticeDetail[] = [
  {
    id: 1,
    category: '운영자 안내',
    title: '청년홈즈 서비스 정식 오픈 안내',
    summary:
      '청년 주거 준비를 한 번에 확인할 수 있는 청년홈즈 서비스가 정식 오픈되었습니다.',
    date: '2026.05.06',
    views: 128,
    important: true,
    isNew: true,
    content: [
      '안녕하세요. 청년홈즈 운영팀입니다.',
      '청년 주거 정보를 더 쉽고 편리하게 확인할 수 있도록 청년홈즈 서비스가 정식 오픈되었습니다.',
      '청년홈즈에서는 주거 정책, 대출 정보, 관심 지역 설정, 매물 검색 등 청년 주거 준비에 필요한 다양한 기능을 제공합니다.',
      '앞으로도 더 안정적이고 편리한 서비스를 제공할 수 있도록 지속적으로 개선해 나가겠습니다.',
      '많은 관심과 이용 부탁드립니다.',
    ],
  },
  {
    id: 2,
    category: '정책 변경',
    title: '청년 주거 지원 정책 정보 업데이트 안내',
    summary:
      '최신 청년 주거 지원 정책과 신청 조건이 새롭게 반영되었습니다.',
    date: '2026.05.05',
    views: 96,
    important: true,
    isNew: true,
    content: [
      '청년 주거 지원 정책 정보가 최신 기준에 맞게 업데이트되었습니다.',
      '이번 업데이트에는 지역별 지원 사업, 신청 자격, 지원 금액, 접수 기간 등의 변경 사항이 포함되어 있습니다.',
      '정책별 세부 조건은 지역과 개인 상황에 따라 달라질 수 있으니 신청 전 반드시 상세 내용을 확인해 주세요.',
      '청년홈즈는 앞으로도 정확한 정책 정보를 제공하기 위해 지속적으로 자료를 관리하겠습니다.',
    ],
  },
  {
    id: 3,
    category: '점검',
    title: '시스템 점검 안내',
    summary:
      '더 안정적인 서비스 제공을 위해 청년홈즈 시스템 점검이 진행될 예정입니다.',
    date: '2026.05.04',
    views: 74,
    important: true,
    isNew: true,
    content: [
      '청년홈즈 서비스 안정화를 위해 시스템 점검이 진행될 예정입니다.',
      '점검 중에는 일부 서비스 이용이 원활하지 않을 수 있습니다.',
      '이용에 불편을 드려 죄송하며, 빠른 시간 내에 점검을 완료할 수 있도록 하겠습니다.',
      '점검 완료 후에는 정상적으로 모든 서비스를 이용하실 수 있습니다.',
    ],
  },
  {
    id: 4,
    category: '약관 변경',
    title: '개인정보 처리방침 개정 안내',
    summary:
      '개인정보 보호 기준 강화를 위해 개인정보 처리방침 일부 내용이 개정됩니다.',
    date: '2026.04.29',
    views: 65,
    important: true,
    content: [
      '청년홈즈 개인정보 처리방침 일부 내용이 개정됩니다.',
      '이번 개정은 개인정보 보호 기준을 강화하고, 이용자 권리 안내를 보다 명확하게 하기 위해 진행됩니다.',
      '개정된 개인정보 처리방침은 공지된 시행일부터 적용됩니다.',
      '서비스 이용 전 변경 내용을 확인해 주시기 바랍니다.',
    ],
  },
  {
    id: 5,
    category: '업데이트',
    title: '공지사항 검색 기능 추가 안내',
    summary:
      '공지사항을 제목과 내용으로 더 빠르게 찾을 수 있도록 검색 기능이 추가되었습니다.',
    date: '2026.05.03',
    views: 112,
    content: [
      '공지사항 검색 기능이 새롭게 추가되었습니다.',
      '이제 제목 또는 제목과 내용을 기준으로 원하는 공지사항을 빠르게 찾을 수 있습니다.',
      '카테고리 선택 기능과 함께 사용하면 더 정확한 검색 결과를 확인할 수 있습니다.',
      '앞으로도 사용자의 편의를 높이기 위한 기능을 계속 개선하겠습니다.',
    ],
  },
  {
    id: 6,
    category: '운영자 안내',
    title: '청년홈즈 커뮤니티 이용 안내',
    summary:
      '청년홈즈 커뮤니티를 안전하고 편리하게 이용하기 위한 기본 안내사항입니다.',
    date: '2026.05.02',
    views: 87,
    content: [
      '청년홈즈 커뮤니티 이용 안내입니다.',
      '커뮤니티에서는 주거 정보, 생활 팁, 정책 후기 등 다양한 내용을 자유롭게 공유할 수 있습니다.',
      '다만 욕설, 비방, 광고성 게시글, 개인정보 노출 글은 제한될 수 있습니다.',
      '서로에게 도움이 되는 건강한 커뮤니티가 될 수 있도록 이용자 여러분의 협조 부탁드립니다.',
    ],
  },
  {
    id: 7,
    category: '업데이트',
    title: '관심 지역 설정 기능 추가 안내',
    summary:
      '자주 확인하는 지역을 관심 지역으로 설정하고 맞춤 정보를 확인할 수 있습니다.',
    date: '2026.05.01',
    views: 134,
    content: [
      '관심 지역 설정 기능이 추가되었습니다.',
      '자주 확인하는 지역을 관심 지역으로 등록하면 해당 지역의 주거 정보와 정책 정보를 더 편리하게 확인할 수 있습니다.',
      '관심 지역은 언제든지 변경할 수 있으며, 추후 맞춤 알림 기능과도 연동될 예정입니다.',
      '청년홈즈는 사용자 맞춤형 서비스를 계속 확대해 나가겠습니다.',
    ],
  },
  {
    id: 8,
    category: '정책 변경',
    title: '청년 주거 지원 기준 변경 안내',
    summary:
      '일부 청년 주거 지원 기준이 변경되어 신청 전 확인이 필요합니다.',
    date: '2026.04.30',
    views: 63,
    content: [
      '일부 청년 주거 지원 기준이 변경되었습니다.',
      '변경된 기준에는 나이, 소득, 거주 요건, 신청 가능 지역 등이 포함될 수 있습니다.',
      '지원 사업마다 적용 기준이 다르므로 신청 전 상세 안내를 꼭 확인해 주세요.',
      '잘못된 정보로 인한 불이익이 발생하지 않도록 최신 내용을 확인하시기 바랍니다.',
    ],
  },
  {
    id: 9,
    category: '업데이트',
    title: '매물 검색 필터 기능 개선 안내',
    summary:
      '원하는 조건의 매물을 더 쉽게 찾을 수 있도록 검색 필터가 개선되었습니다.',
    date: '2026.04.28',
    views: 151,
    content: [
      '매물 검색 필터 기능이 개선되었습니다.',
      '가격, 지역, 주거 형태, 옵션 등 다양한 조건을 활용해 원하는 매물을 더 쉽게 찾을 수 있습니다.',
      '검색 결과 화면의 가독성도 함께 개선되어 매물 정보를 한눈에 비교하기 쉬워졌습니다.',
      '앞으로도 더 편리한 매물 탐색 환경을 제공하겠습니다.',
    ],
  },
  {
    id: 10,
    category: '운영자 안내',
    title: '서비스 이용 중 오류 제보 안내',
    summary:
      '서비스 이용 중 오류를 발견하신 경우 제보 방법을 확인해 주세요.',
    date: '2026.04.27',
    views: 58,
    content: [
      '서비스 이용 중 오류를 발견하신 경우 운영팀에 제보해 주세요.',
      '오류 화면, 발생 상황, 사용 중인 브라우저 정보를 함께 전달해 주시면 더 빠르게 확인할 수 있습니다.',
      '접수된 오류는 검토 후 순차적으로 수정될 예정입니다.',
      '더 안정적인 청년홈즈 서비스를 만들기 위해 노력하겠습니다.',
    ],
  },
  {
    id: 11,
    category: '점검',
    title: '야간 서버 안정화 작업 안내',
    summary:
      '서비스 이용 중 오류를 발견하신 경우 제보 방법을 확인해 주세요.',
    date: '2026.04.26',
    views: 58,
    content: [
      
    ],
  },
];

const categoryStyle: Record<
  NoticeCategory,
  {
    icon: React.ElementType;
    className: string;
  }
> = {
  '운영자 안내': {
    icon: Megaphone,
    className: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  '정책 변경': {
    icon: ShieldCheck,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  점검: {
    icon: Wrench,
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  업데이트: {
    icon: RefreshCcw,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  '약관 변경': {
    icon: FileText,
    className: 'bg-rose-50 text-rose-700 border-rose-100',
  },
};

interface NoticeDetailPageProps {
  params: {
    id: string;
  };
}

export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const noticeId = Number(params.id);
  const notice = notices.find((item) => item.id === noticeId);

  if (!notice) {
    notFound();
  }

  const style = categoryStyle[notice.category];
  const Icon = style.icon;

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/site/notice"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-white px-8 py-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {notice.category}
              </span>

              {notice.important && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  중요
                </span>
              )}

              {notice.isNew && (
                <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  N
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {notice.title}
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-500">
              {notice.summary}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {notice.date}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                조회수 {notice.views}
              </span>
            </div>
          </div>

          <div className="px-8 py-10">
            <div className="rounded-2xl bg-slate-50 px-6 py-5">
              <p className="text-sm font-semibold text-slate-500">
                안내 내용
              </p>
              <p className="mt-2 text-base font-medium text-slate-800">
                아래 내용을 확인해 주세요.
              </p>
            </div>

            <div className="mt-8 space-y-5 text-[15px] leading-8 text-slate-700">
              {notice.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-5">
              <p className="text-sm font-semibold text-slate-700">
                청년홈즈 안내
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                본 공지사항은 청년홈즈 서비스 운영 상황에 따라 변경될 수
                있습니다. 중요한 변경 사항은 공지사항을 통해 다시 안내드리겠습니다.
              </p>
            </div>
          </div>
        </article>

        <div className="mt-6 flex justify-end">
          <Link
            href="/site/notice"
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
          >
            공지사항 목록 보기
          </Link>
        </div>
      </section>
    </main>
  );
}