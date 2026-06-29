import { useEffect, useRef, useState, useCallback } from 'react'
import type { AppProps } from '../../os/types'
import styles from './SoundRecorder.module.css'

type State = 'idle' | 'recording' | 'playing'

export function SoundRecorder({ winId: _winId, args: _args }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(0)
  const posIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [appState, setAppState] = useState<State>('idle')
  const [position, setPosition] = useState(0)
  const [length, setLength] = useState(0)
  const [noDevice, setNoDevice] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)

  // ── Canvas drawing ────────────────────────────────────────────────────────

  const drawFlat = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }, [])

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 1.5
    ctx.beginPath()

    const sliceWidth = canvas.width / bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * canvas.height) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    animRef.current = requestAnimationFrame(drawWaveform)
  }, [])

  const stopAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  // ── Position ticker ───────────────────────────────────────────────────────

  const startTicker = useCallback((onTick: () => void) => {
    if (posIntervalRef.current) clearInterval(posIntervalRef.current)
    posIntervalRef.current = setInterval(onTick, 100)
  }, [])

  const stopTicker = useCallback(() => {
    if (posIntervalRef.current) {
      clearInterval(posIntervalRef.current)
      posIntervalRef.current = null
    }
  }, [])

  // ── Transport actions ─────────────────────────────────────────────────────

  const handleRecord = useCallback(async () => {
    if (appState !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = URL.createObjectURL(blob)
        const dur = (Date.now() - startTimeRef.current) / 1000
        setLength(dur)
        setHasRecording(true)
      }

      recorder.start()
      startTimeRef.current = Date.now()
      setAppState('recording')
      drawWaveform()
      startTicker(() => setPosition((Date.now() - startTimeRef.current) / 1000))
    } catch {
      setNoDevice(true)
    }
  }, [appState, drawWaveform, startTicker])

  const handleStop = useCallback(() => {
    stopAnimation()
    stopTicker()

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null

    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.currentTime = 0
    }

    setAppState('idle')
    setPosition(0)
    drawFlat()
  }, [stopAnimation, stopTicker, drawFlat])

  const handlePlay = useCallback(() => {
    if (!hasRecording || !objectUrlRef.current || appState !== 'idle') return

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyserRef.current = analyser

    const el = audioElRef.current ?? new Audio()
    audioElRef.current = el
    el.src = objectUrlRef.current

    const source = audioCtx.createMediaElementSource(el)
    source.connect(analyser)
    analyser.connect(audioCtx.destination)

    el.onended = () => {
      stopAnimation()
      stopTicker()
      setAppState('idle')
      setPosition(0)
      void audioCtx.close()
      audioCtxRef.current = null
      analyserRef.current = null
      drawFlat()
    }

    startTimeRef.current = Date.now()
    void el.play()
    setAppState('playing')
    drawWaveform()
    startTicker(() => {
      setPosition(el.currentTime)
    })
  }, [hasRecording, appState, drawWaveform, stopAnimation, stopTicker, startTicker, drawFlat])

  const handleSeekStart = useCallback(() => {
    if (!audioElRef.current || appState === 'recording') return
    audioElRef.current.currentTime = 0
    setPosition(0)
  }, [appState])

  const handleSeekEnd = useCallback(() => {
    if (!audioElRef.current || appState === 'recording') return
    audioElRef.current.currentTime = audioElRef.current.duration || 0
    setPosition(length)
  }, [appState, length])

  // ── Init / cleanup ────────────────────────────────────────────────────────

  useEffect(() => {
    drawFlat()
    if (!navigator.mediaDevices?.getUserMedia) setNoDevice(true)
    return () => {
      stopAnimation()
      stopTicker()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (audioCtxRef.current) void audioCtxRef.current.close()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      audioElRef.current?.pause()
    }
  }, [drawFlat, stopAnimation, stopTicker])

  // ── Render ────────────────────────────────────────────────────────────────

  const fmt = (s: number) => s.toFixed(2)

  return (
    <div className={styles.recorder}>
      <div className={styles.display}>
        <canvas ref={canvasRef} className={styles.canvas} width={280} height={60} />
      </div>
      <div className={styles.info}>
        <span>Position: {fmt(position)} sec.</span>
        <span>Length: {fmt(length)} sec.</span>
      </div>
      {noDevice && <div className={styles.status}>No input device</div>}
      <div className={styles.transport}>
        <button
          className={styles.btn}
          title="Seek to Start"
          onClick={handleSeekStart}
          disabled={!hasRecording || appState === 'recording'}
        >
          &#x7C;&#x25C4;
        </button>
        <button
          className={styles.btn}
          title="Seek to End"
          onClick={handleSeekEnd}
          disabled={!hasRecording || appState === 'recording'}
        >
          &#x25BA;&#x7C;
        </button>
        <button
          className={styles.btn}
          title="Play"
          onClick={handlePlay}
          disabled={!hasRecording || appState !== 'idle'}
        >
          &#x25BA;
        </button>
        <button
          className={styles.btn}
          title="Stop"
          onClick={handleStop}
          disabled={appState === 'idle'}
        >
          &#x25A0;
        </button>
        <button
          className={`${styles.btn} ${styles.recBtn}`}
          title="Record"
          onClick={handleRecord}
          disabled={noDevice || appState !== 'idle'}
        >
          &#x25CF;
        </button>
      </div>
    </div>
  )
}
