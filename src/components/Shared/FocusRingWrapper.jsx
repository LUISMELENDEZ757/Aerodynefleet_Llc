import { cn } from '@/lib/utils';

/**
 * FocusRingWrapper
 * Wraps any child with a consistent, WCAG-compliant focus ring.
 * Use around interactive elements that don't already have focus styling.
 *
 * @param {string}  as       - HTML tag or component to render (default: 'div')
 * @param {string}  variant  - 'default' | 'inset' | 'offset'
 * @param {string}  className
 * @param {any}     children
 */
export default function FocusRingWrapper({
  as: Tag = 'div',
  variant = 'default',
  className = '',
  children,
  ...props
}) {
  const ring = {
    default: 'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded-lg',
    inset:   'focus-within:ring-2 focus-within:ring-primary focus-within:ring-inset rounded-lg',
    offset:  'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 rounded-lg',
  }[variant] || '';

  return (
    <Tag className={cn(ring, className)} {...props}>
      {children}
    </Tag>
  );
}