export type XLogoProps = {
  className?: string;
  size?: string;
};

/** Shared X (Twitter) wordmark — View on X buttons and the iconography specimen. */
export function XLogo({ className = "", size }: XLogoProps) {
  return (
    <svg
      width={size ?? "1em"}
      height={size ?? "1em"}
      viewBox="0 0 19 18"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z" />
    </svg>
  );
}

export function XIcon(props: XLogoProps) {
  return <XLogo {...props} />;
}
