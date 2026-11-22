import Icon from './Icon'
import Spinner from './Spinner'

const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger', 'soft'])
const SIZES = new Set(['sm', 'md', 'lg'])

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  block = false,
  iconOnly = false,
  className = '',
} = {}) {
  return [
    'btn',
    `btn--${VARIANTS.has(variant) ? variant : 'primary'}`,
    `btn--${SIZES.has(size) ? size : 'md'}`,
    block ? 'btn--block' : '',
    iconOnly ? 'btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  block = false,
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  const iconOnly = !children && Boolean(icon) && !loading

  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, block, iconOnly, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} label="Working" /> : icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children ? <span className="btn__label">{children}</span> : null}
      {iconRight && !loading ? <Icon name={iconRight} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  )
}
