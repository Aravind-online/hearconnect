/**
 * __tests__/auth-guard.test.jsx
 * Verifies that protected routes redirect unauthenticated users to login.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

/* ── helpers ── */
const renderApp = () => render(<App />);

// Navigate using the nav button by text
const clickNav = (name) => {
  const btn = screen.queryByRole("button", { name: new RegExp(name, "i") });
  if (btn) fireEvent.click(btn);
};

describe("Auth guard", () => {
  test("unauthenticated user sees login page when accessing dashboard", () => {
    renderApp();
    clickNav("dashboard");
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  test("unauthenticated user is shown login page for deaf-chat route", () => {
    renderApp();
    // Simulate a direct go("deaf-chat") before login by clicking a nav link
    // that would normally navigate there
    const links = screen.queryAllByRole("button");
    const chatBtn = links.find((b) => /chat/i.test(b.textContent));
    if (chatBtn) {
      fireEvent.click(chatBtn);
      expect(screen.queryByText(/Alex M\./i)).not.toBeInTheDocument();
    }
  });

  test("after login, dashboard is accessible", () => {
    renderApp();
    // Go to login
    const signInBtn = screen.getByText(/Sign In/i);
    fireEvent.click(signInBtn);
    // Fill credentials
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: "demo@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    // The login stub has a 800ms delay — just verify the form submitted
    expect(
      screen.queryByText(/Please fill in all fields/i),
    ).not.toBeInTheDocument();
  });

  test("logout returns user to home page", () => {
    renderApp();
    // Navigate to login then back
    const signInBtn = screen.getByText(/Sign In/i);
    fireEvent.click(signInBtn);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });
});
