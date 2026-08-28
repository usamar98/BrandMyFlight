export function BrandLogo() {
  return (
    <>
      <svg
        className="wordmark-ticket"
        viewBox="0 0 64 42"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M8 1h48a7 7 0 0 1 7 7v6.3a7.5 7.5 0 0 0 0 13.4V34a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7v-6.3a7.5 7.5 0 0 0 0-13.4V8a7 7 0 0 1 7-7Z"
          clipRule="evenodd"
        />
        <path className="wordmark-ticket-route" d="M15 21h34" />
        <circle className="wordmark-ticket-stop" cx="15" cy="21" r="3.2" />
        <circle className="wordmark-ticket-stop" cx="49" cy="21" r="3.2" />
      </svg>
      <b className="wordmark-name">BrandMyFlight<sup>®</sup></b>
    </>
  );
}
