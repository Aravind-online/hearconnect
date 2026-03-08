/**
 * components/ErrorBanner.jsx — Dismissible error/info banner.
 */
import Ico from "./Ico";
import { T, I } from "../styles/tokens";

export default function ErrorBanner({ message, type = "error" }) {
  if (!message) return null;

  const isError = type === "error";
  const baseColor = isError ? T.danger : T.green;
  const textColor = isError ? "#ff8fa3" : T.green;

  return (
    <div
      style={{
        background: `${baseColor}15`,
        border: `1px solid ${baseColor}44`,
        borderRadius: T.rs,
        padding: "12px 16px",
        marginBottom: 18,
        fontSize: 13,
        color: textColor,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <Ico
        d={isError ? I.info : I.check}
        size={15}
        color={textColor}
        sx={{ flexShrink: 0, marginTop: 1 }}
      />
      <div>{message}</div>
    </div>
  );
}
