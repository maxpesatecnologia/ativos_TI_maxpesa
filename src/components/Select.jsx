import { useEffect, useRef, useState, Children, isValidElement } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

const SEARCH_THRESHOLD = 8;

const DIACRITICS_REGEX = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), 'g');

function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase();
}

export default function Select({
  children,
  value,
  onChange,
  name,
  className = '',
  style,
  triggerStyle,
  required,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const options = Children.toArray(children)
    .filter(isValidElement)
    .map(child => ({
      value: child.props.value !== undefined ? child.props.value : child.props.children,
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

  const showSearch = options.length > SEARCH_THRESHOLD;
  const filteredOptions = showSearch && searchTerm.trim()
    ? options.filter(o => normalize(o.label).includes(normalize(searchTerm)))
    : options;

  const selectedIndex = options.findIndex(o => String(o.value) === String(value));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && showSearch) {
      setSearchTerm('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) setSearchTerm('');
  }, [open, showSearch]);

  useEffect(() => {
    setHighlighted(filteredOptions.length > 0 ? 0 : -1);
  }, [searchTerm]);

  function selectOption(opt) {
    if (opt.disabled) return;
    if (onChange) onChange({ target: { name, value: opt.value } });
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
      } else if (highlighted >= 0 && filteredOptions[highlighted]) {
        selectOption(filteredOptions[highlighted]);
      }
    } else if (e.key === ' ' && !(open && showSearch)) {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
      } else if (highlighted >= 0 && filteredOptions[highlighted]) {
        selectOption(filteredOptions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setHighlighted(h => Math.min(filteredOptions.length - 1, h + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setHighlighted(h => Math.max(0, h - 1));
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div
      className={`custom-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
      style={style}
      ref={rootRef}
    >
      <button
        type="button"
        className={`custom-select-trigger ${className}`}
        style={triggerStyle}
        onClick={() => {
          if (disabled) return;
          setOpen(o => {
            const next = !o;
            if (next) setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
            return next;
          });
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
      >
        <span className="custom-select-value">{selected ? selected.label : ''}</span>
        <ChevronDown size={16} className="custom-select-icon" />
      </button>
      {open && (
        <div className="custom-select-list" role="listbox">
          {showSearch && (
            <input
              ref={searchRef}
              type="text"
              className="custom-select-search"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
            />
          )}
          <ul className="custom-select-options">
            {filteredOptions.map((opt, i) => (
              <li
                key={i}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={[
                  'custom-select-option',
                  String(opt.value) === String(value) ? 'selected' : '',
                  i === highlighted ? 'highlighted' : '',
                  opt.disabled ? 'disabled' : '',
                ].join(' ').trim()}
                onMouseDown={e => {
                  e.preventDefault();
                  selectOption(opt);
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                {opt.label}
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="custom-select-empty">Nenhum resultado encontrado.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
