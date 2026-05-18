export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="0.6em"
      height="0.6em"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-baseline ${className}`}
      style={{ verticalAlign: '0.05em' }}
    >
      <path
        d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
