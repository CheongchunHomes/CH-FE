import Image from "next/image";

export default function AnnouncementDetail() {
    
 
    return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <Image
        src="/images/detail_mock.png"
        alt="공고 상세 페이지"
        width={1200}
        height={1800}
        priority
        style={{
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
        }}
      />
    </div>
  );
}