import { useEffect, useState } from 'react'

// Live tray clock. Ticks once a minute, aligned to the next minute boundary.
export function useClock(): string {
  const [label, setLabel] = useState(formatNow)

  useEffect(() => {
    let timer: number

    const tick = () => {
      setLabel(formatNow())
      // Re-align to the next minute so the clock stays honest over time.
      timer = window.setTimeout(tick, msUntilNextMinute())
    }

    timer = window.setTimeout(tick, msUntilNextMinute())
    return () => window.clearTimeout(timer)
  }, [])

  return label
}

function formatNow(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function msUntilNextMinute(): number {
  const now = new Date()
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
}
