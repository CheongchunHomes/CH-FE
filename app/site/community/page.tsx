'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const REGIONS = {
  seoul: {
    name: '서울특별시',
    districts: [
      { id: 'gangnam', name: '강남구' },
      { id: 'seocho', name: '서초구' },
      { id: 'mapo', name: '마포구' },
      { id: 'songpa', name: '송파구' },
      { id: 'yongsan', name: '용산구' },
    ],
  },
  gyeonggi: {
    name: '경기도',
    districts: [
      { id: 'suwon', name: '수원시' },
      { id: 'seongnam', name: '성남시' },
      { id: 'goyang', name: '고양시' },
      { id: 'yongin', name: '용인시' },
      { id: 'anyang', name: '안양시' },
    ],
  },
  incheon: {
    name: '인천광역시',
    districts: [
      { id: 'bupyeong', name: '부평구' },
      { id: 'namdong', name: '남동구' },
      { id: 'yeonsu', name: '연수구' },
      { id: 'michuhol', name: '미추홀구' },
    ],
  },
  busan: {
    name: '부산광역시',
    districts: [
      { id: 'haeundae', name: '해운대구' },
      { id: 'busanjin', name: '부산진구' },
      { id: 'dongnae', name: '동래구' },
      { id: 'saha', name: '사하구' },
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
      alert('게시글을 불러오지 못했습니다.');
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
    if (!city) return true;

    const cityName = REGIONS[city].name;

    if (!district) {
      return post.region?.startsWith(cityName);
    }

    const districtName = REGIONS[city].districts.find(
      (d) => d.id === district
    )?.name;

    return post.region === `${cityName} ${districtName}`;
  });

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
          onChange={(e) => setDistrict(e.target.value)}
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
                  filteredPosts.map((post) => (
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
                      해당 지역에 등록된 게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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