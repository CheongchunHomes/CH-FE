'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
  createdAt: string;
}

export default function CommunityPage() {
  const MAIN_COLOR = '#2196F3';

  const theme = {
    color: MAIN_COLOR,
    radius: '10px',
  };

  const [city, setCity] = useState<CityKey | ''>('seoul');
  const [district, setDistrict] = useState('seocho');

  const [isWriting, setIsWriting] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
  });

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const POSTS_PER_PAGE = 10;

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/community/list', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`게시글 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
      userId: 1,
      region: `${cityName} ${districtName}`,
      title: newPost.title,
      content: newPost.content,
      viewCount: 0,
    };

    try {
      const response = await fetch('/api/community/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('저장 실패:', response.status, errorText);
        alert(`DB 저장 실패: ${response.status}`);
        return;
      }

      alert('글이 저장되었습니다.');

      setNewPost({
        title: '',
        content: '',
      });

      setIsWriting(false);
      fetchPosts();
    } catch (error) {
      console.error(error);
      alert('서버 연결 실패');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const keyword = searchKeyword.trim().toLowerCase();

    const matchesRegion = (() => {
      if (!city) return true;

      const cityName = REGIONS[city].name;

      if (!district) {
        return post.region?.startsWith(cityName);
      }

      const districtName = REGIONS[city].districts.find(
        (d) => d.id === district
      )?.name;

      return post.region === `${cityName} ${districtName}`;
    })();

    const matchesSearch =
      !keyword ||
      post.title?.toLowerCase().includes(keyword) ||
      post.content?.toLowerCase().includes(keyword) ||
      post.region?.toLowerCase().includes(keyword);

    return matchesRegion && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;

  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
                minWidth: '600px',
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
                  <th style={{ width: '80px' }}>조회수</th>
                  <th style={{ width: '120px' }}>날짜</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#999',
                      }}
                    >
                      게시글을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : filteredPosts.length > 0 ? (
                  currentPosts.map((post) => (
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

                      <td>{Number(post.viewCount ?? 0).toLocaleString()}</td>

                      <td
                        style={{
                          color: '#888',
                          fontSize: '0.9rem',
                        }}
                      >
                        {post.createdAt?.slice(0, 10)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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
          {totalPages > 1 && (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '20px',
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
        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
      }}
    >
      이전
    </button>

    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${page === currentPage ? theme.color : '#ddd'}`,
          backgroundColor: page === currentPage ? theme.color : '#fff',
          color: page === currentPage ? '#fff' : '#333',
          cursor: 'pointer',
          fontWeight: page === currentPage ? 'bold' : 'normal',
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
        backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
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
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
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
              onClick={() => setCurrentPage(1)}
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
    </div>
  );
}