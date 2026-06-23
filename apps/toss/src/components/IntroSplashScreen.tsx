import { useEffect, useRef, useState } from 'react'

interface LeafParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  angle: number
  swingSpeed: number
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const destroyTimer = setTimeout(() => setIsVisible(false), 2700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const leaves: LeafParticle[] = []
    const colors = [
      'rgba(52, 211, 153, ', // Mint Green
      'rgba(167, 243, 208, ', // Pale Emerald
      'rgba(209, 250, 229, ', // Mint Ice
    ]

    for (let i = 0; i < 25; i++) {
      leaves.push({
        x: Math.random() * width,
        y: height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.8 + 0.4),
        size: Math.random() * 6 + 3,
        alpha: Math.random() * 0.4 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        angle: Math.random() * Math.PI,
        swingSpeed: Math.random() * 0.03 + 0.01,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let frame = 0
    const render = () => {
      frame++
      ctx.fillStyle = '#0b1612' // Forest Sage-Dark background
      ctx.fillRect(0, 0, width, height)

      // Draw leaves swinging left and right as they float up
      leaves.forEach((l) => {
        if (!l) return
        l.x += l.vx + Math.sin(l.angle) * 0.4
        l.y += l.vy
        l.angle += l.swingSpeed

        if (l.y < -50) {
          l.y = height + 50
          l.x = Math.random() * width
        }

        ctx.beginPath()
        ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2)
        ctx.fillStyle = l.color + l.alpha + ')'
        ctx.fill()
      })

      // Main Text
      const text = 'FAMILY CARE'
      ctx.font = '900 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '6px'
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(52, 211, 153, 0.5)'

      const progress = Math.min(frame / 40, 1)
      const currentText = text.substring(0, Math.floor(text.length * progress))
      ctx.fillText(currentText, width / 2, height / 2)
      ctx.shadowBlur = 0

      // Sub
      ctx.font = '500 10px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)'
      ctx.fillText('FAMILY CAREGIVING PORTAL', width / 2, height / 2 + 32)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1612',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
