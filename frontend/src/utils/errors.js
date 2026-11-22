export function getFieldErrors(error) {
  const fieldErrors = error?.response?.data?.fieldErrors
  return fieldErrors && typeof fieldErrors === 'object' ? fieldErrors : null
}

export function getErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  if (typeof error === 'string') return error

  const data = error.response?.data

  if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
    const messages = Object.entries(data.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(' · ')
    if (messages) return messages
  }

  if (data?.message) return data.message
  if (data?.error) return data.error

  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the TrustDesk API. Check that the backend is running on port 8080.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. The AI operation may still be running — refresh in a moment.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  return error.message || 'Something went wrong. Please try again.'
}

export function isUnauthorized(error) {
  return error?.response?.status === 401
}

export function isConflict(error) {
  return error?.response?.status === 409
}
