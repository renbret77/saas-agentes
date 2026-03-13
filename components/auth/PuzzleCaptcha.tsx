"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { ShieldCheck, ChevronRight, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface PuzzleCaptchaProps {
  onVerify: () => void
  className?: string
}

export default function PuzzleCaptcha({ onVerify, className }: PuzzleCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  
  // Track width for responsiveness
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxWidth, setMaxWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      // Container width minus handle width (approx 64px)
      setMaxWidth(containerRef.current.offsetWidth - 64)
    }
  }, [])

  // Background color transition based on progress
  const backgroundColor = useTransform(
    x,
    [0, maxWidth],
    ["rgba(241, 245, 249, 1)", "rgba(16, 185, 129, 0.1)"]
  )

  const handleDragEnd = () => {
    setIsDragging(false)
    if (x.get() >= maxWidth - 5) {
      x.set(maxWidth)
      setIsVerified(true)
      onVerify()
    } else {
      x.set(0)
    }
  }

  return (
    <div 
      className={cn("space-y-3", className)}
      ref={containerRef}
    >
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificación Humana</span>
        {isVerified && (
          <motion.span 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"
          >
            <UserCheck className="w-3 h-3" /> VERIFICADO
          </motion.span>
        )}
      </div>

      <motion.div 
        style={{ backgroundColor }}
        className={cn(
          "relative h-16 w-full rounded-2xl border transition-all overflow-hidden",
          isVerified ? "border-emerald-500/50" : "border-slate-200"
        )}
      >
        {/* Shimmer effect background */}
        {!isVerified && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <motion.div 
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </div>
        )}

        {/* Text prompt */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
          (isDragging || isVerified) ? "opacity-0" : "opacity-100"
        )}>
          <span className="text-sm font-bold text-slate-400 select-none">Desliza para confirmar</span>
        </div>

        {/* The Slider Handle */}
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: maxWidth }}
            dragElastic={0.05}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className={cn(
              "absolute top-1 left-1 bottom-1 w-14 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shadow-lg transition-colors",
              isVerified ? "bg-emerald-500 text-white" : "bg-white text-slate-900",
              !isVerified && "hover:bg-slate-50 border border-slate-100"
            )}
        >
          {isVerified ? (
            <ShieldCheck className="w-6 h-6" />
          ) : (
            <ChevronRight className={cn(
                "w-6 h-6 transition-transform",
                isDragging && "scale-110"
            )} />
          )}
        </motion.div>

        {/* Progress Fill */}
        <motion.div 
          style={{ width: x }}
          className="absolute top-0 left-0 bottom-0 bg-emerald-500/10 pointer-events-none"
        />
      </motion.div>
    </div>
  )
}
