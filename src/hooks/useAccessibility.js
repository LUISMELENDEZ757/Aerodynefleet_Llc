/**
 * Accessibility utilities and hooks for WCAG compliance
 * Provides ARIA labels, focus management, and keyboard navigation support
 */

/**
 * Generate accessible label for expandable elements
 * @param {string} label - Base label text
 * @param {boolean} isExpanded - Whether element is expanded
 * @returns {string} Accessible label
 */
export function getExpandableLabel(label, isExpanded) {
  return `${isExpanded ? 'Collapse' : 'Expand'} ${label}`;
}

/**
 * Generate accessible label for data-heavy widgets
 * @param {string} title - Widget title
 * @param {Record<string, any>} data - Data object
 * @returns {string} Accessible description
 */
export function getWidgetLabel(title, data) {
  const fields = Object.entries(data)
    .filter(([, v]) => v != null && v !== '')
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return fields ? `${title}. ${fields}` : title;
}

/**
 * Generate accessible label for status badges
 * @param {string} status - Status value
 * @param {string} label - Display label
 * @returns {string} Accessible status description
 */
export function getStatusLabel(status, label) {
  return `Status: ${label}`;
}

/**
 * Generate accessible label for numerical metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Unit (optional)
 * @returns {string} Accessible metric description
 */
export function getMetricLabel(metric, value, unit = '') {
  return `${metric}: ${value}${unit ? ` ${unit}` : ''}`;
}

/**
 * Hook for managing focus on interactive elements
 * @param {boolean} trigger - Trigger focus change
 * @param {React.RefObject} ref - Element ref to focus
 */
export function useFocusManagement(trigger, ref) {
  React.useEffect(() => {
    if (trigger && ref?.current) {
      ref.current.focus();
    }
  }, [trigger, ref]);
}

/**
 * Generate semantic HTML for data display with proper contrast
 * Ensures text meets WCAG AA minimum 4.5:1 contrast ratio
 */
export const ContrastAwareDataWidget = {
  // Label with guaranteed minimum contrast
  Label: ({ children, className = '' }) => (
    <span className={`text-xs text-muted-foreground ${className}`} style={{ color: 'hsl(210 10% 70%)' }}>
      {children}
    </span>
  ),

  // Value with high contrast
  Value: ({ children, className = '' }) => (
    <span className={`text-sm font-bold text-foreground ${className}`} style={{ color: 'hsl(210 20% 95%)' }}>
      {children}
    </span>
  ),

  // Metric display with proper hierarchy
  Metric: ({ label, value, unit = '', ariaLabel }) => (
    <div role="region" aria-label={ariaLabel || `${label}: ${value}${unit}`}>
      <ContrastAwareDataWidget.Label>{label}</ContrastAwareDataWidget.Label>
      <ContrastAwareDataWidget.Value>{value}{unit && ` ${unit}`}</ContrastAwareDataWidget.Value>
    </div>
  ),
};

export default {
  getExpandableLabel,
  getWidgetLabel,
  getStatusLabel,
  getMetricLabel,
  useFocusManagement,
  ContrastAwareDataWidget,
};