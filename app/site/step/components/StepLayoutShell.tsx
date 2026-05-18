"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { StepBar } from "./StepBar"

type StepLayoutContextValue = {
  setCurrentStep: (step: number) => void
}

const StepLayoutContext = createContext<StepLayoutContextValue | null>(null)

export function StepLayoutShell({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1)
  const value = useMemo(() => ({ setCurrentStep }), [])

  return (
    <StepLayoutContext.Provider value={value}>
      <StepBar currentStep={currentStep} />
      {children}
    </StepLayoutContext.Provider>
  )
}

export function useStepBar(currentStep: number) {
  const context = useContext(StepLayoutContext)

  if (!context) {
    throw new Error("useStepBar must be used inside StepLayoutShell")
  }

  useEffect(() => {
    context.setCurrentStep(currentStep)

    return () => {
      context.setCurrentStep(1)
    }
  }, [context, currentStep])
}
