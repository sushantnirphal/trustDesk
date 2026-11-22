import Card from '../../components/ui/Card'
import Icon from '../../components/ui/Icon'
import { formatCurrency, formatDateTime } from '../../utils/format'

function DetailRow({ label, value }) {
  return (
    <div className="kv">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}

export default function ContextCards({ context }) {
  const customer = context?.customer
  const order = context?.order
  const ticket = context?.ticket

  return (
    <div className="grid grid--3">
      <Card className="card--compact">
        <div className="context-card">
          <span className="context-card__icon context-card__icon--indigo">
            <Icon name="user" size={18} />
          </span>
          <h3>Customer</h3>
          <dl className="kv-list">
            <DetailRow label="Name" value={customer?.name} />
            <DetailRow label="Email" value={customer?.email} />
            <DetailRow label="Phone" value={customer?.phone} />
            <DetailRow label="Address" value={customer?.address} />
          </dl>
        </div>
      </Card>

      <Card className="card--compact">
        <div className="context-card">
          <span className="context-card__icon context-card__icon--teal">
            <Icon name="package" size={18} />
          </span>
          <h3>Order</h3>
          {order ? (
            <dl className="kv-list">
              <DetailRow label="Order" value={`#${order.id}`} />
              <DetailRow label="Status" value={order.status} />
              <DetailRow label="Items" value={order.items} />
              <DetailRow label="Total" value={formatCurrency(order.total)} />
              <DetailRow label="Warranty" value={`${order.warrantyWindowDays ?? '—'} days`} />
            </dl>
          ) : (
            <p className="text-muted">No order linked to this ticket.</p>
          )}
        </div>
      </Card>

      <Card className="card--compact">
        <div className="context-card">
          <span className="context-card__icon context-card__icon--amber">
            <Icon name="clock" size={18} />
          </span>
          <h3>Ticket</h3>
          <dl className="kv-list">
            <DetailRow label="Ticket" value={`#${ticket?.id ?? '—'}`} />
            <DetailRow label="Created" value={formatDateTime(ticket?.createdAt)} />
            <DetailRow label="Escalation" value={ticket?.escalationNeeded ? 'Required' : 'Not required'} />
            <DetailRow label="Order linked" value={order ? 'Yes' : 'No'} />
          </dl>
        </div>
      </Card>
    </div>
  )
}
