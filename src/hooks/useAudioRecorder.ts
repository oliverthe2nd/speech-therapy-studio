import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'processing'

const SOUNDWAVE_BARS = 7

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [levels, setLevels] = useState<number[]>(
    Array(SOUNDWAVE_BARS).fill(0.35),
  )

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | null>(null)

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setLevels(Array(SOUNDWAVE_BARS).fill(0.35))
  }, [])

  const startVisualizer = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const sliceSize = Math.floor(data.length / SOUNDWAVE_BARS)
      const nextLevels = Array.from({ length: SOUNDWAVE_BARS }, (_, index) => {
        const start = index * sliceSize
        const slice = data.slice(start, start + sliceSize)
        const average =
          slice.reduce((sum, value) => sum + value, 0) / slice.length
        return Math.min(1, average / 140)
      })
      setLevels(nextLevels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [])

  const cleanupAudio = useCallback(async () => {
    stopVisualizer()

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null

    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    chunksRef.current = []
  }, [stopVisualizer])

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream

    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)
    analyserRef.current = analyser

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current = recorder
    recorder.start(250)
    setStatus('recording')
    startVisualizer()
  }, [startVisualizer])

  const stopRecording = useCallback(async (): Promise<Blob> => {
    const recorder = mediaRecorderRef.current
    if (!recorder) {
      throw new Error('No active recording.')
    }

    stopVisualizer()
    setStatus('processing')

    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        resolve(new Blob(chunksRef.current, { type }))
      }
      recorder.onerror = () => reject(new Error('Recording failed.'))
      recorder.stop()
    })

    await cleanupAudio()
    return blob
  }, [cleanupAudio, stopVisualizer])

  const resetStatus = useCallback(() => {
    setStatus('idle')
  }, [])

  useEffect(() => {
    return () => {
      void cleanupAudio()
    }
  }, [cleanupAudio])

  return {
    status,
    setStatus,
    levels,
    isRecording: status === 'recording',
    startRecording,
    stopRecording,
    resetStatus,
    cleanupAudio,
  }
}
