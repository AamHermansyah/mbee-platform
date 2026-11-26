import { Suspense } from "react"

import { TicketBoardPage } from "@/components/tickets/ticket-board-page"

export default function TicketPage() {
  // useSearchParams (?ticket_id=) butuh Suspense saat build statis
  return (
    <Suspense>
      <TicketBoardPage />
    </Suspense>
  )
}
