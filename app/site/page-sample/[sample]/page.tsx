import Image from "next/image"
import { notFound } from "next/navigation"

import { getPageSample, pageSamples } from "@/lib/page-samples"

type PageSamplePageProps = {
  params: Promise<{
    sample: string
  }>
}

export function generateStaticParams() {
  return pageSamples.map((sample) => ({
    sample: sample.slug,
  }))
}

export async function generateMetadata({ params }: PageSamplePageProps) {
  const { sample: slug } = await params
  const sample = getPageSample(slug)

  if (!sample) {
    return {
      title: "페이지 샘플",
    }
  }

  return {
    title: `${sample.label} | 페이지 샘플`,
  }
}

export default async function PageSamplePage({ params }: PageSamplePageProps) {
  const { sample: slug } = await params
  const sample = getPageSample(slug)

  if (!sample) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Image
        src={sample.image}
        alt={`${sample.label} 페이지 디자인 샘플`}
        width={1440}
        height={2400}
        sizes="700px"
        className="mx-auto h-auto w-full max-w-[700px]"
        priority
      />
    </main>
  )
}
