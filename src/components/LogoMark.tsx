// The RevMeets brand mark (same checkered-flag art as the favicon / app icon).
// Sized in `em` so it scales with the surrounding logo font-size. Decorative —
// the adjacent "REVMEETS" wordmark carries the accessible name.
export function LogoMark({ size = "1.25em" }: { size?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <rect width="100" height="100" rx="22" fill="#FF5F1F" />
      <g fill="#ffffff">
        <rect x="28" y="28" width="11" height="11" />
        <rect x="50" y="28" width="11" height="11" />
        <rect x="39" y="39" width="11" height="11" />
        <rect x="61" y="39" width="11" height="11" />
        <rect x="28" y="50" width="11" height="11" />
        <rect x="50" y="50" width="11" height="11" />
        <rect x="39" y="61" width="11" height="11" />
        <rect x="61" y="61" width="11" height="11" />
      </g>
    </svg>
  );
}
