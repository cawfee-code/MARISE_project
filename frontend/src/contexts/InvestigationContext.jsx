import { createContext, useState } from 'react'

export const InvestigationContext = createContext()

export function InvestigationProvider({ children }) {
  const [data, setData] = useState(() => {
    const savedData = sessionStorage.getItem('mariseInvestigation')

    if (savedData) {
      return JSON.parse(savedData)
    }

    return {}
  })

  const [isAutoRun, setIsAutoRun] = useState(false)

  const updateData = (key, value) => {
    setData(previous => {
      const updated = {
        ...previous,
        [key]: value
      }

      const dataToSave = {
        ...updated
      }

      delete dataToSave.maskblob

      sessionStorage.setItem(
        'mariseInvestigation',
        JSON.stringify(dataToSave)
      )

      return updated
    })
  }

  const clearData = () => {
    setData({})
    sessionStorage.removeItem('mariseInvestigation')
  }

  return (
    <InvestigationContext.Provider
      value={{
        data,
        updateData,
        clearData,
        isAutoRun,
        setIsAutoRun
      }}
    >
      {children}
    </InvestigationContext.Provider>
  )
}