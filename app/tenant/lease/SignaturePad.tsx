'use client'
import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function SignaturePad({ leaseId }: { leaseId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
    setHasSignature(true)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDraw() {
    setDrawing(false)
  }

  function clearPad() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function submitSignature() {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    setLoading(true)
    setError('')
    try {
      const signatureData = canvas.toDataURL('image/png')
      const res = await fetch('/api/leases/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId, signatureData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to sign lease')
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-emerald-800">Lease Signed Successfully</p>
        <p className="text-xs text-emerald-600 mt-1">Your signature has been recorded.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800">Sign Your Lease</h2>
        <p className="text-xs text-slate-500 mt-0.5">Draw your signature in the box below to digitally sign your lease agreement.</p>
      </div>

      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm font-medium select-none">Sign here</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={clearPad} className="flex-1">Clear</Button>
        <Button
          variant="primary"
          onClick={submitSignature}
          loading={loading}
          disabled={!hasSignature}
          className="flex-1"
        >
          Confirm & Sign
        </Button>
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        By signing, you agree to the terms of the lease agreement. This is a legally binding signature.
      </p>
    </div>
  )
}
