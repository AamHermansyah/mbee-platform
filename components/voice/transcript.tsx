"use client"

import { AudioLines } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"

import { MessageAttachmentView } from "@/components/voice/message-attachments"
import { ASSISTANT_NAME } from "@/lib/constants/brand"
import type { VoiceMessage } from "@/lib/stores/voice-store"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Transcript({ messages }: { messages: VoiceMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastText = messages.at(-1)?.text

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages.length, lastText])

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-slate-500">
          <AudioLines className="size-4" />
        </span>
        <p className="text-xs text-slate-600">Tekan “Mulai bicara”, lalu transkrip percakapan akan tampil di sini.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 px-3 py-3" aria-live="polite" aria-label="Transkrip percakapan">
      {messages.map((message) => {
        const isAgent = message.role === "agent"
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex max-w-[88%] flex-col gap-0.5", isAgent ? "self-start" : "self-end items-end")}
          >
            <span className="px-1 text-[10px] text-slate-500">
              {isAgent ? `${ASSISTANT_NAME} (Voice AI)` : "Pelanggan"} · {formatTime(message.at)}
            </span>
            <p
              className={cn(
                "rounded-2xl px-3 py-2 text-xs leading-relaxed",
                isAgent
                  ? "rounded-tl-sm border border-border bg-white text-slate-800"
                  : "rounded-tr-sm bg-primary text-primary-foreground"
              )}
            >
              {message.text}
              {message.streaming && (
                <span className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 animate-pulse bg-current" aria-hidden />
              )}
            </p>
            {message.attachment && !message.streaming && (
              <div className="w-full">
                <MessageAttachmentView attachment={message.attachment} />
              </div>
            )}
          </motion.div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
