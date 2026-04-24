import { PageSampleView } from "@/components/page-sample-view"
import { getPageSample } from "@/lib/page-samples"

export default function SubscriptionPage() {
  const sample = getPageSample("subscription")

  if (!sample) {
    return null
  }

  return <PageSampleView image={sample.image} label={sample.label} />
}
