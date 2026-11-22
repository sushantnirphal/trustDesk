import { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { FormField, Input, Select, Textarea } from '../../components/ui/Field'
import { useCustomers, useOrders } from '../../hooks/useCustomers'
import { useCreateTicket } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'

const initialForm = {
  customerId: '',
  orderId: '',
  subject: '',
  description: '',
}

function validate(form) {
  const errors = {}
  if (!form.customerId) errors.customerId = 'Select a customer.'
  if (!form.subject.trim()) errors.subject = 'Subject is required.'
  else if (form.subject.trim().length > 200) errors.subject = 'Subject must be 200 characters or fewer.'
  if (!form.description.trim()) errors.description = 'Description is required.'
  else if (form.description.trim().length < 10) errors.description = 'Add a little more detail (at least 10 characters).'
  return errors
}

export default function CreateTicketModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const { data: orders = [], isLoading: ordersLoading } = useOrders(form.customerId || null)
  const createTicket = useCreateTicket()

  useEffect(() => {
    if (open) {
      setForm(initialForm)
      setErrors({})
    }
  }, [open])

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'customerId') next.orderId = ''
      return next
    })
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      const ticket = await createTicket.mutateAsync({
        customerId: Number(form.customerId),
        orderId: form.orderId ? Number(form.orderId) : null,
        subject: form.subject.trim(),
        description: form.description.trim(),
      })
      toast.success(`Ticket #${ticket.id} created.`)
      onClose?.()
      onCreated?.(ticket)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={createTicket.isPending ? undefined : onClose}
      title="Create ticket"
      description="Log a new customer issue. AI triage and draft generation run from the ticket workspace."
      size="md"
      closeOnBackdrop={!createTicket.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createTicket.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-ticket-form" loading={createTicket.isPending} icon="plus">
            Create ticket
          </Button>
        </>
      }
    >
      <form id="create-ticket-form" className="form-grid" onSubmit={submit} noValidate>
        <FormField label="Customer" htmlFor="ticket-customer" error={errors.customerId} required>
          <Select
            id="ticket-customer"
            value={form.customerId}
            onChange={(event) => update('customerId', event.target.value)}
            invalid={Boolean(errors.customerId)}
            disabled={customersLoading}
          >
            <option value="">{customersLoading ? 'Loading customers…' : 'Select a customer'}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} · {customer.email}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Related order"
          htmlFor="ticket-order"
          hint="Optional. Only orders belonging to the selected customer are listed."
        >
          <Select
            id="ticket-order"
            value={form.orderId}
            onChange={(event) => update('orderId', event.target.value)}
            disabled={!form.customerId || ordersLoading}
          >
            <option value="">
              {!form.customerId ? 'Select a customer first' : ordersLoading ? 'Loading orders…' : 'No linked order'}
            </option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                Order #{order.id} · {order.status} · ${Number(order.total).toFixed(2)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Subject" htmlFor="ticket-subject" error={errors.subject} required className="form-grid__full">
          <Input
            id="ticket-subject"
            value={form.subject}
            onChange={(event) => update('subject', event.target.value)}
            placeholder="Short summary of the issue"
            maxLength={200}
            invalid={Boolean(errors.subject)}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="ticket-description"
          error={errors.description}
          hint={`${form.description.length}/5000 characters`}
          required
          className="form-grid__full"
        >
          <Textarea
            id="ticket-description"
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="What happened? Include order details, dates, and what the customer is asking for."
            rows={6}
            maxLength={5000}
            invalid={Boolean(errors.description)}
          />
        </FormField>
      </form>
    </Modal>
  )
}
