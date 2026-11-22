import { Link, useNavigate } from 'react-router-dom'
import { CategoryBadge, PriorityBadge, TicketStatusBadge } from '../../components/ui/MetaBadges'
import { formatRelative, truncate } from '../../utils/format'
import Icon from '../../components/ui/Icon'

export default function TicketTable({ tickets }) {
  const navigate = useNavigate()

  return (
    <div className="table-wrap">
      <table className="data-table ticket-table">
        <thead>
          <tr>
            <th scope="col">Ticket</th>
            <th scope="col">Customer</th>
            <th scope="col">Category</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
            <th scope="col" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const openTicket = () => navigate(`/tickets/${ticket.id}`)
            return (
              <tr
                key={ticket.id}
                className="clickable-row"
                tabIndex={0}
                onClick={openTicket}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openTicket()
                  }
                }}
                aria-label={`Open ticket ${ticket.id}: ${ticket.subject}`}
              >
                <td data-label="Ticket">
                  <div className="ticket-cell">
                    <span className="ticket-cell__id">#{ticket.id}</span>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="ticket-cell__subject"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {ticket.subject}
                    </Link>
                    <span className="ticket-cell__snippet">{truncate(ticket.description, 72)}</span>
                  </div>
                </td>
                <td data-label="Customer">
                  <div className="stack-tight">
                    <span>{ticket.customer?.name ?? 'Unknown customer'}</span>
                    <span className="text-subtle">{ticket.customer?.email ?? '—'}</span>
                  </div>
                </td>
                <td data-label="Category">
                  <CategoryBadge category={ticket.category} />
                </td>
                <td data-label="Priority">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td data-label="Status">
                  <TicketStatusBadge status={ticket.status} />
                </td>
                <td data-label="Created">
                  <span className="text-muted" title={ticket.createdAt}>{formatRelative(ticket.createdAt)}</span>
                </td>
                <td className="table-chevron">
                  <Icon name="chevronRight" size={16} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
