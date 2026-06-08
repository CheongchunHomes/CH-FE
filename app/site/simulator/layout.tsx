import { Nanum_Pen_Script } from "next/font/google"

import "./simulator.css"

const nanumPenScript = Nanum_Pen_Script({
  weight: "400",
  preload: false,
  variable: "--font-nanum-pen-script",
})

export default function SimulatorLayout({
                                          children,
                                        }: {
  children: React.ReactNode
}) {
  return (
    <div className={nanumPenScript.variable}>
      {children}
    </div>
  )
}
