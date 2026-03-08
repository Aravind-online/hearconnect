/**
 * components/StatusBadge.jsx — WebSocket connection status badge.
 */
import Ico from "./Ico";
import { T, I } from "../styles/tokens";

const STATUS_COLOR = {
  idle: T.muted,
  connecting: T.warn,
  connected: T.green,
  error: T.danger,
};
const STATUS_LABEL = {
  idle: "Disconnected",
  connecting: "Connecting…",
  connected: "Live",
  error: "Error",
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] ?? T.muted;
  const label = STATUS_LABEL[status] ?? status;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <Ico
        d={status === "connected" ? I.wifi : I.nowifi}
        size={13}
        color={color}
      />
      <span style={{ color }}>{label}</span>
    </div>
  );
}
