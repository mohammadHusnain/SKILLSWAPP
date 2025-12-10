"use client"

import * as React from "react"

const ToastContext = React.createContext()

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

let id = 0
export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback(({ title, description, variant, duration = 4000 }) => {
    const toast = { id: ++id, title, description, variant }
    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}
