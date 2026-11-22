import { Component } from 'react'
import Icon from './ui/Icon'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <div className="fatal-error__card">
            <span className="fatal-error__icon">
              <Icon name="alert" size={26} />
            </span>
            <h1>Something went wrong</h1>
            <p>The interface hit an unexpected error. Reloading usually fixes it.</p>
            <pre>{String(this.state.error?.message ?? this.state.error)}</pre>
            <button type="button" className="btn btn--primary btn--md" onClick={() => window.location.reload()}>
              Reload TrustDesk
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
