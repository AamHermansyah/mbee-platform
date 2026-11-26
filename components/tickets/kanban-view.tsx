"use client"

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { Inbox } from "lucide-react"

import { TicketCard } from "@/components/tickets/ticket-card"
import { ISSUE_STATUSES } from "@/lib/constants/ticket"
import type { IssueStatus, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Kanban tiket, struktur dari mimin kanban-view.tsx (@hello-pangea/dnd):
 * kolom per status dengan garis warna di atas, tiap kolom di-scroll sendiri,
 * pindah kolom = ubah status.
 */
export function KanbanView({
  tickets,
  selectedId,
  liveTicketId,
  onMove,
  onOpen,
  onEdit,
  onDelete,
}: {
  tickets: Ticket[]
  selectedId: string | null
  liveTicketId: string | null
  onMove: (ticketId: string, status: IssueStatus) => void
  onOpen: (ticket: Ticket) => void
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return
    onMove(draggableId, destination.droppableId as IssueStatus)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Layar lebar: kolom berbagi lebar tanpa scroll horizontal (dnd hanya mendukung satu kontainer scroll per kolom). */}
      <div className="custom-scrollbar flex gap-3 overflow-x-auto pb-3 sm:gap-4 xl:overflow-x-visible">
        {ISSUE_STATUSES.map((status) => {
          const items = tickets.filter((t) => t.issueStatus === status.id)
          return (
            <section
              key={status.id}
              aria-label={`Kolom ${status.label}`}
              className="flex w-[min(400px,calc(100vw-32px))] shrink-0 flex-col overflow-hidden rounded-xl border border-t-4 border-border bg-white xl:w-auto xl:min-w-0 xl:flex-1"
              style={{ borderTopColor: status.color }}
            >
              <header className="relative flex items-center gap-2.5 border-b border-border px-4 py-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{status.label}</h2>
                <span className="rounded-full border border-border bg-white px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </header>

              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div className={cn("h-[50vh] transition-colors duration-150 sm:h-[67vh]", snapshot.isDraggingOver && "bg-muted")}>
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="custom-scrollbar flex h-full max-h-full flex-col gap-y-3 overflow-y-auto p-3"
                    >
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center">
                          <Inbox className="size-5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Tidak ada tiket dalam status ini</p>
                        </div>
                      )}
                      {items.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(drag, dragSnapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              className={cn(dragSnapshot.isDragging && "z-50 rounded-xl shadow-lg")}
                            >
                              <TicketCard
                                ticket={ticket}
                                selected={ticket.id === selectedId}
                                live={ticket.id === liveTicketId}
                                onOpen={() => onOpen(ticket)}
                                onEdit={() => onEdit(ticket)}
                                onDelete={() => onDelete(ticket)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </section>
          )
        })}
      </div>
    </DragDropContext>
  )
}
