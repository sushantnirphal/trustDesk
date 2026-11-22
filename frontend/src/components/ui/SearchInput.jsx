import Icon from './Icon'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  id,
  className = '',
}) {
  return (
    <div className={`search-input ${className}`.trim()}>
      <Icon name="search" size={16} className="search-input__icon" />
      <input
        id={id}
        type="search"
        className="search-input__field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value ? (
        <button
          type="button"
          className="search-input__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  )
}
