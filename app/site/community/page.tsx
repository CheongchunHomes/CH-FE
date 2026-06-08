'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { get, post, request, ApiError } from '@/lib/api';

const REGIONS = {
  seoul: {
    name: '서울특별시',
    districts: [
      { id: 'gangnam', name: '강남구' },
      { id: 'gangdong', name: '강동구' },
      { id: 'gangbuk', name: '강북구' },
      { id: 'gangseo', name: '강서구' },
      { id: 'gwanak', name: '관악구' },
      { id: 'gwangjin', name: '광진구' },
      { id: 'guro', name: '구로구' },
      { id: 'geumcheon', name: '금천구' },
      { id: 'nowon', name: '노원구' },
      { id: 'dobong', name: '도봉구' },
      { id: 'dongdaemun', name: '동대문구' },
      { id: 'dongjak', name: '동작구' },
      { id: 'mapo', name: '마포구' },
      { id: 'seodaemun', name: '서대문구' },
      { id: 'seocho', name: '서초구' },
      { id: 'seongdong', name: '성동구' },
      { id: 'seongbuk', name: '성북구' },
      { id: 'songpa', name: '송파구' },
      { id: 'yangcheon', name: '양천구' },
      { id: 'yeongdeungpo', name: '영등포구' },
      { id: 'yongsan', name: '용산구' },
      { id: 'eunpyeong', name: '은평구' },
      { id: 'jongno', name: '종로구' },
      { id: 'jung', name: '중구' },
      { id: 'jungnang', name: '중랑구' },
    ],
  },

  busan: {
    name: '부산광역시',
    districts: [
      { id: 'gangseo', name: '강서구' },
      { id: 'geumjeong', name: '금정구' },
      { id: 'gijang', name: '기장군' },
      { id: 'nam', name: '남구' },
      { id: 'dong', name: '동구' },
      { id: 'dongnae', name: '동래구' },
      { id: 'busanjin', name: '부산진구' },
      { id: 'buk', name: '북구' },
      { id: 'sasang', name: '사상구' },
      { id: 'saha', name: '사하구' },
      { id: 'seo', name: '서구' },
      { id: 'suyeong', name: '수영구' },
      { id: 'yeonje', name: '연제구' },
      { id: 'yeongdo', name: '영도구' },
      { id: 'jung', name: '중구' },
      { id: 'haeundae', name: '해운대구' },
    ],
  },

  daegu: {
    name: '대구광역시',
    districts: [
      { id: 'gunwi', name: '군위군' },
      { id: 'nam', name: '남구' },
      { id: 'dalseo', name: '달서구' },
      { id: 'dalseong', name: '달성군' },
      { id: 'dong', name: '동구' },
      { id: 'buk', name: '북구' },
      { id: 'seo', name: '서구' },
      { id: 'suseong', name: '수성구' },
      { id: 'jung', name: '중구' },
    ],
  },

  incheon: {
    name: '인천광역시',
    districts: [
      { id: 'ganghwa', name: '강화군' },
      { id: 'gyeyang', name: '계양구' },
      { id: 'namdong', name: '남동구' },
      { id: 'dong', name: '동구' },
      { id: 'michuhol', name: '미추홀구' },
      { id: 'bupyeong', name: '부평구' },
      { id: 'seo', name: '서구' },
      { id: 'yeonsu', name: '연수구' },
      { id: 'ongjin', name: '옹진군' },
      { id: 'jung', name: '중구' },
    ],
  },

  gwangju: {
    name: '광주광역시',
    districts: [
      { id: 'gwangsan', name: '광산구' },
      { id: 'nam', name: '남구' },
      { id: 'dong', name: '동구' },
      { id: 'buk', name: '북구' },
      { id: 'seo', name: '서구' },
    ],
  },

  daejeon: {
    name: '대전광역시',
    districts: [
      { id: 'daedeok', name: '대덕구' },
      { id: 'dong', name: '동구' },
      { id: 'seo', name: '서구' },
      { id: 'yuseong', name: '유성구' },
      { id: 'jung', name: '중구' },
    ],
  },

  ulsan: {
    name: '울산광역시',
    districts: [
      { id: 'nam', name: '남구' },
      { id: 'dong', name: '동구' },
      { id: 'buk', name: '북구' },
      { id: 'ulju', name: '울주군' },
      { id: 'jung', name: '중구' },
    ],
  },

  sejong: {
    name: '세종특별자치시',
    districts: [{ id: 'sejong', name: '세종시' }],
  },

  gyeonggi: {
    name: '경기도',
    districts: [
      { id: 'gapyeong', name: '가평군' },
      { id: 'goyang', name: '고양시' },
      { id: 'gwacheon', name: '과천시' },
      { id: 'gwangmyeong', name: '광명시' },
      { id: 'gwangju', name: '광주시' },
      { id: 'guri', name: '구리시' },
      { id: 'gunpo', name: '군포시' },
      { id: 'gimpo', name: '김포시' },
      { id: 'namyangju', name: '남양주시' },
      { id: 'dongducheon', name: '동두천시' },
      { id: 'bucheon', name: '부천시' },
      { id: 'seongnam', name: '성남시' },
      { id: 'suwon', name: '수원시' },
      { id: 'siheung', name: '시흥시' },
      { id: 'ansan', name: '안산시' },
      { id: 'anseong', name: '안성시' },
      { id: 'anyang', name: '안양시' },
      { id: 'yangju', name: '양주시' },
      { id: 'yangpyeong', name: '양평군' },
      { id: 'yeoju', name: '여주시' },
      { id: 'yeoncheon', name: '연천군' },
      { id: 'osan', name: '오산시' },
      { id: 'yongin', name: '용인시' },
      { id: 'uiwang', name: '의왕시' },
      { id: 'uijeongbu', name: '의정부시' },
      { id: 'icheon', name: '이천시' },
      { id: 'paju', name: '파주시' },
      { id: 'pyeongtaek', name: '평택시' },
      { id: 'pocheon', name: '포천시' },
      { id: 'hanam', name: '하남시' },
      { id: 'hwaseong', name: '화성시' },
    ],
  },

  gangwon: {
    name: '강원특별자치도',
    districts: [
      { id: 'gangneung', name: '강릉시' },
      { id: 'goseong', name: '고성군' },
      { id: 'donghae', name: '동해시' },
      { id: 'samcheok', name: '삼척시' },
      { id: 'sokcho', name: '속초시' },
      { id: 'yanggu', name: '양구군' },
      { id: 'yangyang', name: '양양군' },
      { id: 'yeongwol', name: '영월군' },
      { id: 'wonju', name: '원주시' },
      { id: 'inje', name: '인제군' },
      { id: 'jeongseon', name: '정선군' },
      { id: 'cheorwon', name: '철원군' },
      { id: 'chuncheon', name: '춘천시' },
      { id: 'taebaek', name: '태백시' },
      { id: 'pyeongchang', name: '평창군' },
      { id: 'hongcheon', name: '홍천군' },
      { id: 'hwacheon', name: '화천군' },
      { id: 'hoengseong', name: '횡성군' },
    ],
  },

  chungbuk: {
    name: '충청북도',
    districts: [
      { id: 'goesan', name: '괴산군' },
      { id: 'danyang', name: '단양군' },
      { id: 'boeun', name: '보은군' },
      { id: 'yeongdong', name: '영동군' },
      { id: 'okcheon', name: '옥천군' },
      { id: 'eumseong', name: '음성군' },
      { id: 'jecheon', name: '제천시' },
      { id: 'jeungpyeong', name: '증평군' },
      { id: 'jincheon', name: '진천군' },
      { id: 'cheongju', name: '청주시' },
      { id: 'chungju', name: '충주시' },
    ],
  },

  chungnam: {
    name: '충청남도',
    districts: [
      { id: 'gyeryong', name: '계룡시' },
      { id: 'gongju', name: '공주시' },
      { id: 'geumsan', name: '금산군' },
      { id: 'nonsan', name: '논산시' },
      { id: 'dangjin', name: '당진시' },
      { id: 'boryeong', name: '보령시' },
      { id: 'buyeo', name: '부여군' },
      { id: 'seosan', name: '서산시' },
      { id: 'seocheon', name: '서천군' },
      { id: 'asan', name: '아산시' },
      { id: 'yesan', name: '예산군' },
      { id: 'cheonan', name: '천안시' },
      { id: 'cheongyang', name: '청양군' },
      { id: 'taean', name: '태안군' },
      { id: 'hongseong', name: '홍성군' },
    ],
  },

  jeonbuk: {
    name: '전북특별자치도',
    districts: [
      { id: 'gochang', name: '고창군' },
      { id: 'gunsan', name: '군산시' },
      { id: 'gimje', name: '김제시' },
      { id: 'namwon', name: '남원시' },
      { id: 'muju', name: '무주군' },
      { id: 'buan', name: '부안군' },
      { id: 'sunchang', name: '순창군' },
      { id: 'wanju', name: '완주군' },
      { id: 'iksan', name: '익산시' },
      { id: 'imsil', name: '임실군' },
      { id: 'jangsu', name: '장수군' },
      { id: 'jeonju', name: '전주시' },
      { id: 'jeongeup', name: '정읍시' },
      { id: 'jinan', name: '진안군' },
    ],
  },

  jeonnam: {
    name: '전라남도',
    districts: [
      { id: 'gangjin', name: '강진군' },
      { id: 'goheung', name: '고흥군' },
      { id: 'gokseong', name: '곡성군' },
      { id: 'gwangyang', name: '광양시' },
      { id: 'gurye', name: '구례군' },
      { id: 'naju', name: '나주시' },
      { id: 'damyang', name: '담양군' },
      { id: 'mokpo', name: '목포시' },
      { id: 'muan', name: '무안군' },
      { id: 'boseong', name: '보성군' },
      { id: 'suncheon', name: '순천시' },
      { id: 'sinan', name: '신안군' },
      { id: 'yeosu', name: '여수시' },
      { id: 'yeonggwang', name: '영광군' },
      { id: 'yeongam', name: '영암군' },
      { id: 'wando', name: '완도군' },
      { id: 'jangseong', name: '장성군' },
      { id: 'jangheung', name: '장흥군' },
      { id: 'jindo', name: '진도군' },
      { id: 'hampyeong', name: '함평군' },
      { id: 'haenam', name: '해남군' },
      { id: 'hwasun', name: '화순군' },
    ],
  },

  gyeongbuk: {
    name: '경상북도',
    districts: [
      { id: 'gyeongsan', name: '경산시' },
      { id: 'gyeongju', name: '경주시' },
      { id: 'goryeong', name: '고령군' },
      { id: 'gumi', name: '구미시' },
      { id: 'gimcheon', name: '김천시' },
      { id: 'mungyeong', name: '문경시' },
      { id: 'bonghwa', name: '봉화군' },
      { id: 'sangju', name: '상주시' },
      { id: 'seongju', name: '성주군' },
      { id: 'andong', name: '안동시' },
      { id: 'yeongdeok', name: '영덕군' },
      { id: 'yeongyang', name: '영양군' },
      { id: 'yeongju', name: '영주시' },
      { id: 'yeongcheon', name: '영천시' },
      { id: 'yecheon', name: '예천군' },
      { id: 'ulleung', name: '울릉군' },
      { id: 'uljin', name: '울진군' },
      { id: 'uiseong', name: '의성군' },
      { id: 'cheongdo', name: '청도군' },
      { id: 'cheongsong', name: '청송군' },
      { id: 'chilgok', name: '칠곡군' },
      { id: 'pohang', name: '포항시' },
    ],
  },

  gyeongnam: {
    name: '경상남도',
    districts: [
      { id: 'geoje', name: '거제시' },
      { id: 'geochang', name: '거창군' },
      { id: 'goseong', name: '고성군' },
      { id: 'gimhae', name: '김해시' },
      { id: 'namhae', name: '남해군' },
      { id: 'miryang', name: '밀양시' },
      { id: 'sacheon', name: '사천시' },
      { id: 'sancheong', name: '산청군' },
      { id: 'yangsan', name: '양산시' },
      { id: 'uiryeong', name: '의령군' },
      { id: 'jinju', name: '진주시' },
      { id: 'changnyeong', name: '창녕군' },
      { id: 'changwon', name: '창원시' },
      { id: 'tongyeong', name: '통영시' },
      { id: 'hadong', name: '하동군' },
      { id: 'haman', name: '함안군' },
      { id: 'hamyang', name: '함양군' },
      { id: 'hapcheon', name: '합천군' },
    ],
  },

  jeju: {
    name: '제주특별자치도',
    districts: [
      { id: 'seogwipo', name: '서귀포시' },
      { id: 'jeju', name: '제주시' },
    ],
  },
};

type CityKey = keyof typeof REGIONS;

interface CommunityPost {
  postId: number;
  userId: number;
  region: string;
  title: string;
  content: string;
  viewCount: number;
  createdAt?: string;
}

interface CommunityPageResponse {
  content: CommunityPost[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface CommunityNotice {
  noticeId: number;
  category: string;
  title: string;
  summary?: string;
  important?: boolean;
  viewCount?: number;
  createdAt?: string;
}

interface CommunityNoticeDetail extends CommunityNotice {
  content: string;
}

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams.get('admin') === '1';

  const MAIN_COLOR = '#2563EB';

  const theme = {
    color: MAIN_COLOR,
    radius: '10px',
  };

  const [city, setCity] = useState<CityKey | ''>('');
  const [district, setDistrict] = useState('');

  const [isWriting, setIsWriting] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
  });

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [communityNotices, setCommunityNotices] = useState<CommunityNotice[]>(
    []
  );
  const [selectedNotice, setSelectedNotice] =
    useState<CommunityNoticeDetail | null>(null);
  const [noticeDetailLoading, setNoticeDetailLoading] = useState(false);
  const [noticeDetailError, setNoticeDetailError] = useState('');

  const POSTS_PER_PAGE = 10;
  const PAGES_PER_BLOCK = 10;
  const latestCommunityNotices = communityNotices.slice(0, 3);

  const formatDateTime = (value?: string) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectedRegion = () => {
    if (!city) return '';

    const cityName = REGIONS[city].name;

    if (!district) {
      return cityName;
    }

    const districtName = REGIONS[city].districts.find(
      (d) => d.id === district
    )?.name;

    return districtName ? `${cityName} ${districtName}` : cityName;
  };

  const fetchPosts = async (targetPage = currentPage) => {
    try {
      setLoading(true);

      const data = await get<CommunityPageResponse>('/api/community/list', {
        query: {
          page: targetPage - 1,
          size: POSTS_PER_PAGE,
          region: getSelectedRegion(),
          keyword: searchKeyword.trim(),
        },
        cache: 'no-store',
      });

      setPosts(Array.isArray(data.content) ? data.content : []);
      setTotalPages(Number(data.totalPages ?? 0));
      setTotalElements(Number(data.totalElements ?? 0));
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('게시글 조회 실패:', error.message);
      } else {
        console.error(error);
      }

      setPosts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityNotices = async () => {
    try {
      const data = await get<CommunityNotice[]>('/api/notice/community/latest', {
        cache: 'no-store',
      });

      setCommunityNotices(
        Array.isArray(data)
          ? data.filter((notice) => notice.category === '커뮤니티').slice(0, 3)
          : []
      );
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('커뮤니티 공지 조회 실패:', error.message);
      } else {
        console.error(error);
      }

      setCommunityNotices([]);
    }
  };

  const handleOpenCommunityNotice = async (noticeId: number) => {
    try {
      setSelectedNotice(null);
      setNoticeDetailError('');
      setNoticeDetailLoading(true);

      const data = await get<CommunityNoticeDetail>(`/api/notice/${noticeId}`, {
        cache: 'no-store',
      });

      if (data.category !== '커뮤니티') {
        setNoticeDetailError('커뮤니티 공지사항이 아닙니다.');
        return;
      }

      setSelectedNotice({
        ...data,
        viewCount: data.viewCount ?? 0,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setNoticeDetailError(error.message);
      } else {
        setNoticeDetailError('커뮤니티 공지사항을 불러오지 못했습니다.');
      }
    } finally {
      setNoticeDetailLoading(false);
    }
  };

  const handleCloseCommunityNotice = () => {
    setSelectedNotice(null);
    setNoticeDetailError('');
    setNoticeDetailLoading(false);
  };

  useEffect(() => {
    fetchCommunityNotices();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, city, district, searchKeyword]);

  const handleSubmit = async () => {
    if (!newPost.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!newPost.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (!city || !district) {
      alert('지역을 선택해주세요.');
      return;
    }

    const cityName = REGIONS[city].name;
    const districtName = REGIONS[city].districts.find(
      (d) => d.id === district
    )?.name;

    const postData = {
      region: `${cityName} ${districtName}`,
      title: newPost.title,
      content: newPost.content,
    };

    try {
      await post('/api/community/add', postData);

      alert('글이 저장되었습니다.');

      setNewPost({
        title: '',
        content: '',
      });

      setIsWriting(false);
      setCurrentPage(1);
      await fetchPosts(1);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('저장 실패:', error.message);
      } else {
        console.error(error);
      }
    }
  };

  const handleDeletePost = async (postId: number) => {
    const ok = window.confirm(
      '이 게시글을 삭제할까요? 삭제하면 복구할 수 없습니다.'
    );

    if (!ok) return;

    try {
      await request('DELETE', `/api/community/admin/${postId}`);

      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchPosts(currentPage);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('게시글 삭제 실패:', error.message);
      } else {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const currentBlock = Math.floor((currentPage - 1) / PAGES_PER_BLOCK);
  const startPage = currentBlock * PAGES_PER_BLOCK + 1;
  const endPage = Math.min(startPage + PAGES_PER_BLOCK - 1, totalPages);
  const pageNumbers = Array.from(
    { length: Math.max(endPage - startPage + 1, 0) },
    (_, index) => startPage + index
  );

  const selectStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: theme.radius,
    border: `2px solid ${theme.color}`,
    outline: 'none',
    fontSize: '14px',
    backgroundColor: '#fff',
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'Pretendard, sans-serif',
        color: '#333',
      }}
    >
      <header
        style={{
          marginBottom: '30px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px',
        }}
      >
        <h3
          style={{
            fontWeight: 'bold',
            fontSize: '1.8rem',
            margin: 0,
          }}
        >
          동네 커뮤니티
        </h3>

        <p
          style={{
            color: '#666',
            marginTop: '5px',
          }}
        >
          우리 동네의 따끈따끈한 소식을 확인하세요.
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '25px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          지역 필터:
        </span>

        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value as CityKey | '');
            setDistrict('');
            setCurrentPage(1);
          }}
          style={selectStyle}
        >
          <option value="">전체 시/도</option>

          {Object.entries(REGIONS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.name}
            </option>
          ))}
        </select>

        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setCurrentPage(1);
          }}
          disabled={!city}
          style={{
            ...selectStyle,
            opacity: city ? 1 : 0.5,
            cursor: city ? 'pointer' : 'not-allowed',
          }}
        >
          <option value="">전체 구/군</option>

          {city &&
            REGIONS[city].districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>

        {city && (
          <button
            onClick={() => {
              setCity('');
              setDistrict('');
              setSearchKeyword('');
              setCurrentPage(1);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            필터 초기화
          </button>
        )}
      </div>

      {isWriting ? (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: theme.radius,
            padding: '25px',
            marginBottom: '20px',
            backgroundColor: '#f9f9f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <h4
            style={{
              marginBottom: '15px',
              color: theme.color,
              marginTop: 0,
            }}
          >
            {city && district
              ? `[${REGIONS[city].name} ${
                  REGIONS[city].districts.find((d) => d.id === district)?.name
                }] 새 글 작성`
              : '먼저 지역을 선택해주세요'}
          </h4>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={newPost.title}
            onChange={(e) =>
              setNewPost((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />

          <textarea
            placeholder="내용을 입력하세요"
            value={newPost.content}
            onChange={(e) =>
              setNewPost((prev) => ({
                ...prev,
                content: e.target.value,
              }))
            }
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              boxSizing: 'border-box',
              resize: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setIsWriting(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              취소
            </button>

            <button
              onClick={handleSubmit}
              disabled={!city || !district}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                backgroundColor: city && district ? theme.color : '#ccc',
                color: '#fff',
                border: 'none',
                cursor: city && district ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
              }}
            >
              등록하기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '20px',
                minWidth: '760px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${theme.color}`,
                    textAlign: 'left',
                    color: '#666',
                  }}
                >
                  <th style={{ padding: '12px 10px', width: '60px' }}>
                    번호
                  </th>
                  <th style={{ width: '150px' }}>지역</th>
                  <th>제목</th>
                  <th style={{ width: '160px' }}>등록일</th>
                  <th style={{ width: '80px' }}>조회수</th>
                  {isAdminMode && <th style={{ width: '130px' }}>관리</th>}
                </tr>
              </thead>

              <tbody>
                {latestCommunityNotices.map((notice) => (
                  <tr
                    key={`notice-${notice.noticeId}`}
                    onClick={() => handleOpenCommunityNotice(notice.noticeId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fbff';
                    }}
                    style={{
                      borderBottom: '1px solid #dbeafe',
                      backgroundColor: '#f8fbff',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '15px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          borderRadius: '999px',
                          backgroundColor: notice.important
                            ? '#fef3c7'
                            : '#dbeafe',
                          color: notice.important ? '#b45309' : '#1d4ed8',
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {notice.important ? '중요' : '공지'}
                      </span>
                    </td>

                    <td
                      style={{
                        fontSize: '0.85rem',
                        color: '#1d4ed8',
                      }}
                    >
                      <span
                        style={{
                          background: '#eff6ff',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          fontWeight: 700,
                        }}
                      >
                        커뮤니티
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong
                          style={{
                            color: '#111827',
                            fontSize: '0.95rem',
                          }}
                        >
                          {notice.title}
                        </strong>
                      </div>

                      {notice.summary && (
                        <p
                          style={{
                            margin: '5px 0 0',
                            color: '#64748b',
                            fontSize: '13px',
                            lineHeight: 1.45,
                          }}
                        >
                          {notice.summary}
                        </p>
                      )}
                    </td>

                    <td
                      style={{
                        color: '#64748b',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDateTime(notice.createdAt)}
                    </td>

                    <td>{Number(notice.viewCount ?? 0).toLocaleString()}</td>

                    {isAdminMode && <td />}
                  </tr>
                ))}

                {loading ? (
                  <tr>
                    <td
                      colSpan={isAdminMode ? 6 : 5}
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#999',
                      }}
                    >
                      게시글을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <tr
                      key={post.postId}
                      style={{
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <td style={{ padding: '15px 10px' }}>{post.postId}</td>

                      <td
                        style={{
                          fontSize: '0.85rem',
                          color: '#666',
                        }}
                      >
                        <span
                          style={{
                            background: '#f0f0f0',
                            padding: '3px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {post.region}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/site/community/${post.postId}`}
                          style={{
                            textDecoration: 'none',
                            color: '#333',
                            cursor: 'pointer',
                            fontWeight: '500',
                          }}
                        >
                          {post.title}
                        </Link>
                      </td>

                      <td
                        style={{
                          color: '#64748b',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(post.createdAt)}
                      </td>

                      <td>{Number(post.viewCount ?? 0).toLocaleString()}</td>

                      {isAdminMode && (
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              alignItems: 'center',
                            }}
                          >
                            <Link
                              href={`/site/community/${post.postId}/edit?admin=1`}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '10px',
                                border: '1px solid #bfdbfe',
                                backgroundColor: '#fff',
                                color: '#1d4ed8',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                              }}
                            >
                              수정
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.postId)}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#ff5a5f',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdminMode ? 6 : 5}
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#999',
                      }}
                    >
                      조건에 맞는 게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
              marginBottom: '10px',
            }}
          >
            총 {totalElements.toLocaleString()}건
          </div>

          {totalPages > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                  color: currentPage === 1 ? '#aaa' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                이전
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: '36px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${
                      page === currentPage ? theme.color : '#ddd'
                    }`,
                    backgroundColor: page === currentPage ? theme.color : '#fff',
                    color: page === currentPage ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: page === currentPage ? 'bold' : 600,
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor:
                    currentPage === totalPages ? '#f5f5f5' : '#fff',
                  color: currentPage === totalPages ? '#aaa' : '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                다음
              </button>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="제목, 내용, 지역으로 검색"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchKeyword(searchInput.trim());
                  setCurrentPage(1);
                }

                if (e.key === 'Escape') {
                  setSearchInput('');
                  setSearchKeyword('');
                  setCurrentPage(1);
                }
              }}
              style={{
                width: '280px',
                maxWidth: '100%',
                padding: '10px 12px',
                borderRadius: theme.radius,
                border: '1px solid #ddd',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />

            <button
              onClick={() => {
                setSearchKeyword(searchInput.trim());
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: theme.radius,
                border: 'none',
                backgroundColor: theme.color,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              검색
            </button>

            {searchKeyword && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchKeyword('');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: theme.radius,
                  border: '1px solid #ddd',
                  backgroundColor: '#fff',
                  color: '#666',
                  cursor: 'pointer',
                }}
              >
                초기화
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setIsWriting(true)}
              style={{
                padding: '12px 30px',
                backgroundColor: theme.color,
                color: '#fff',
                border: 'none',
                borderRadius: theme.radius,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.1s, opacity 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              새 글 쓰기
            </button>
          </div>
        </>
      )}

      {(noticeDetailLoading || noticeDetailError || selectedNotice) && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseCommunityNotice}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "rgba(15, 23, 42, 0.45)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: "24px",
              backgroundColor: "#fff",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                borderBottom: "1px solid #e5e7eb",
                background: "linear-gradient(135deg, #eff6ff, #fff)",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    border: "1px solid #bfdbfe",
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  커뮤니티 공지사항
                </span>

                <button
                  type="button"
                  onClick={handleCloseCommunityNotice}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "999px",
                    backgroundColor: "#fff",
                    color: "#64748b",
                    cursor: "pointer",
                    fontWeight: 700,
                    padding: "8px 12px",
                  }}
                >
                  닫기
                </button>
              </div>

              {noticeDetailLoading ? (
                <p style={{ margin: 0, color: "#475569", fontWeight: 700 }}>
                  커뮤니티 공지사항을 불러오는 중입니다.
                </p>
              ) : noticeDetailError ? (
                <p style={{ margin: 0, color: "#dc2626", fontWeight: 700 }}>
                  {noticeDetailError}
                </p>
              ) : selectedNotice ? (
                <>
                  <h4
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: "1.6rem",
                      lineHeight: 1.35,
                    }}
                  >
                    {selectedNotice.title}
                  </h4>

                  {selectedNotice.summary && (
                    <p
                      style={{
                        margin: "12px 0 0",
                        color: "#64748b",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedNotice.summary}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "14px",
                      marginTop: "16px",
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}
                  >
                    <span>등록일 {formatDateTime(selectedNotice.createdAt)}</span>
                    <span>
                      조회수 {Number(selectedNotice.viewCount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {selectedNotice && !noticeDetailLoading && !noticeDetailError && (
              <div
                style={{
                  padding: "30px 28px",
                  color: "#334155",
                  fontSize: "15px",
                  lineHeight: 1.9,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedNotice.content}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
  <Suspense fallback={null}>
    <CommunityPageContent />
  </Suspense>
  )
}