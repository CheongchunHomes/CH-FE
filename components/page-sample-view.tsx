import Image from "next/image"
import Link from "next/link"

type PageSampleViewProps = {
  image: string
  label: string
  href?: string
}

export function PageSampleView({ image, label, href }: PageSampleViewProps) {
  const imageElement = (
    <Image
      src={image}
      alt={`${label} 페이지 디자인 샘플`}
      width={1440}
      height={2400}
      sizes="700px"
      className="mx-auto h-auto w-full max-w-[700px]"
      priority
    />
  )

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      {href ? <Link href={href}>{imageElement}</Link> : imageElement}
    </main>
  )
}
