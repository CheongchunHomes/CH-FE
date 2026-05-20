import { StepLayoutShell } from "./components/StepLayoutShell"

export default function StepLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <StepLayoutShell>{children}</StepLayoutShell>
}
