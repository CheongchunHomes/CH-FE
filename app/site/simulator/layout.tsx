import "./simulator.css"

export default function SimulatorLayout({
                                          children,
                                        }: {
  children: React.ReactNode
}) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet" />
      {children}
    </>
  )
}
