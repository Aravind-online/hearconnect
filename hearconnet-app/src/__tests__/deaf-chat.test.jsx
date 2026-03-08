/**
 * __tests__/deaf-chat.test.jsx
 * DeafChatPage: message send, auto-reply, and clear.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeafChatPage from "../pages/DeafChatPage";

describe("DeafChatPage", () => {
  beforeEach(() => render(<DeafChatPage />));

  test("renders initial greeting from Alex", () => {
    expect(screen.getByText(/How are you today/i)).toBeInTheDocument();
  });

  test("send button is disabled when input is empty", () => {
    const send = screen.getByRole("button", { name: /send message/i });
    expect(send).toBeDisabled();
  });

  test("typing enables the send button", () => {
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: "Hello!" } });
    const send = screen.getByRole("button", { name: /send message/i });
    expect(send).not.toBeDisabled();
  });

  test("sent message appears in the chat", () => {
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  test("input is cleared after sending", () => {
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: "Clear me" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });

  test("typing indicator appears after send", async () => {
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: "Hey!" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/typing/i)).toBeInTheDocument();
  });

  test("auto-reply arrives after delay", async () => {
    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: "Hi Alex" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(
      () => expect(screen.queryByText(/typing/i)).not.toBeInTheDocument(),
      { timeout: 2500 },
    );
    // A new message from Alex should now be in the DOM
    const msgs = screen.getAllByText(/Alex M\./i);
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });
});
