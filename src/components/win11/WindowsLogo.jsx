// Simple Windows-style four-pane mark used for the Start button.
export default function WindowsLogo({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M3 5.7l8.2-1.1v8.1H3zM12.2 4.4L21 3.2v9.5h-8.8zM3 12.5h8.2v8.1L3 19.5zM12.2 12.5H21v9.4l-8.8-1.2z" />
    </svg>
  );
}