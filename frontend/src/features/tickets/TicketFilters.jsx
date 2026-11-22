import SearchInput from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../../utils/constants'
import { titleCase } from '../../utils/format'

export default function TicketFilters({ value, onChange, onReset, hasActiveFilters }) {
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue })

  return (
    <div className="filters">
      <SearchInput
        value={value.q}
        onChange={(q) => update('q', q)}
        placeholder="Search subject, customer, or ticket ID…"
        label="Search tickets"
        className="filters__search"
      />

      <Select
        aria-label="Filter by status"
        value={value.status}
        onChange={(event) => update('status', event.target.value)}
        className="filters__select"
      >
        <option value="ALL">All statuses</option>
        {TICKET_STATUSES.map((status) => (
          <option key={status} value={status}>
            {titleCase(status)}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by category"
        value={value.category}
        onChange={(event) => update('category', event.target.value)}
        className="filters__select"
      >
        <option value="ALL">All categories</option>
        {TICKET_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {titleCase(category)}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by priority"
        value={value.priority}
        onChange={(event) => update('priority', event.target.value)}
        className="filters__select"
      >
        <option value="ALL">All priorities</option>
        {TICKET_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {titleCase(priority)}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Sort tickets"
        value={value.sort}
        onChange={(event) => update('sort', event.target.value)}
        className="filters__select"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="priority">Priority</option>
        <option value="status">Status</option>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" icon="close" onClick={onReset}>
          Clear
        </Button>
      ) : null}
    </div>
  )
}
