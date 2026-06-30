import { useEffect, useState } from 'react'

export interface ClockState {
  time: string
  /** Full date string for the hover tooltip (e.g. "Tuesday, June 30, 2026"). */
  tooltip: string
  /** A Date stamped at the last tick — drives the calendar popup. */
  now: Date
}

// Live tray clock. Ticks once a minute, aligned to the next minute boundary.
export function useClock(): ClockState {
  const [state, setState] = useState(snapshot)

  useEffect(() => {
    let timer: number

    const tick = () => {
      setState(snapshot())
      // Re-align to the next minute so the clock stays honest over time.
      timer = window.setTimeout(tick, msUntilNextMinute())
    }

    timer = window.setTimeout(tick, msUntilNextMinute())
    return () => window.clearTimeout(timer)
  }, [])

  return state
}

function snapshot(): ClockState {
  const now = new Date()
  return {
    time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    tooltip: now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    now,
  }
}

function msUntilNextMinute(): number {
  const now = new Date()
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
}
