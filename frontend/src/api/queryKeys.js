export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  dashboard: {
    stats: ['dashboard', 'stats'],
  },
  tickets: {
    all: ['tickets'],
    list: (filters = {}) => ['tickets', 'list', filters],
    detail: (ticketId) => ['tickets', 'detail', String(ticketId)],
    context: (ticketId) => ['tickets', 'context', String(ticketId)],
    triage: (ticketId) => ['tickets', 'triage', String(ticketId)],
  },
  customers: {
    all: ['customers'],
  },
  orders: {
    all: ['orders'],
    byCustomer: (customerId) => ['orders', 'customer', String(customerId)],
  },
  drafts: {
    all: ['drafts'],
    forTicket: (ticketId) => ['drafts', 'ticket', String(ticketId)],
  },
  actions: {
    all: ['actions'],
    pending: ['actions', 'pending'],
    detail: (actionId) => ['actions', 'detail', String(actionId)],
    forTicket: (ticketId) => ['actions', 'ticket', String(ticketId)],
  },
  traces: {
    all: ['traces'],
    list: (runType) => ['traces', 'list', runType || 'ALL'],
    forTicket: (ticketId) => ['traces', 'ticket', String(ticketId)],
  },
  evaluations: {
    cases: ['evaluations', 'cases'],
    case: (caseId) => ['evaluations', 'case', caseId],
  },
  knowledgeBase: {
    catalog: ['knowledge-base', 'catalog'],
    document: (kbId) => ['knowledge-base', 'document', kbId],
  },
}
