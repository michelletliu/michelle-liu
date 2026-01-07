export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="0.6em"
      height="0.6em"
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-baseline ${className}`}
      style={{ verticalAlign: '0.05em' }}
    >
      <path
        d="M0.928172 8.30395L0.0001719 7.35995L7.04017 0.319951L7.98417 1.26395L0.928172 8.30395ZM1.96817 1.35995V-4.95911e-05H8.30417L7.80817 1.34395L1.96817 1.35995ZM6.94417 6.33595L6.96017 0.479951L8.30417 -4.95911e-05V6.33595H6.94417Z"
        fill="currentColor"
      />
    </svg>
  );
}
