/**
 * components/Ico.jsx — Reusable SVG icon wrapper.
 */
export default function Ico({ d, size = 20, color = "currentColor", sx = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={sx}
    >
      <path d={d} />
    </svg>
  );
}
