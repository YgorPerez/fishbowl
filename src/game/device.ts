import { useEffect } from 'react'

let audioCtx: AudioContext | null = null

/** iOS só libera áudio depois de um toque: chame dentro de um onClick. */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    audioCtx = null
  }
}

export function beep(frequency = 880, durationMs = 120, volume = 0.15) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.value = frequency
  gain.gain.value = volume
  osc.connect(gain).connect(audioCtx.destination)
  const t = audioCtx.currentTime
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000)
  osc.start(t)
  osc.stop(t + durationMs / 1000)
}

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

/** Mantém a tela acesa enquanto `active` (Screen Wake Lock API). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((s) => {
          if (cancelled) void s.release()
          else sentinel = s
        })
        .catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }
    request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release()
    }
  }, [active])
}
