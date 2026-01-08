'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface YearContextType {
    selectedYear: number
    setSelectedYear: (year: number) => void
    availableYears: number[]
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export function YearProvider({ children }: { children: ReactNode }) {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const availableYears = [2025, 2026]

    return (
        <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
            {children}
        </YearContext.Provider>
    )
}

export function useYear() {
    const context = useContext(YearContext)
    if (context === undefined) {
        throw new Error('useYear must be used within a YearProvider')
    }
    return context
}
