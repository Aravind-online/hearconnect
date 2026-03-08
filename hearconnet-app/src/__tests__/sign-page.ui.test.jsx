/**
 * __tests__/sign-page.ui.test.jsx
 * SignLanguagePage: smoke-test UI elements; WS/camera are not exercised.
 */
import { render, screen } from "@testing-library/react";
import SignLanguagePage from "../pages/SignLanguagePage";

// Stub useSignDetection so we don't need a real camera/WS in tests
jest.mock("../hooks/useSignDetection", () => ({
  useSignDetection: () => ({
    running: false,
    wsStatus: "idle",
    result: null,
    history: [],
    serverInfo: null,
    error: null,
    startSession: jest.fn(),
    stopSession: jest.fn(),
    speak: jest.fn(),
    speaking: false,
    clearHistory: jest.fn(),
    videoRef: { current: null },
    canvasRef: { current: null },
  }),
}));

describe("SignLanguagePage – static UI", () => {
  beforeEach(() => render(<SignLanguagePage />));

  test("renders heading", () => {
    expect(
      screen.getByRole("heading", { name: /Sign Language/i }),
    ).toBeInTheDocument();
  });

  test("Start Live Detection button is visible when not running", () => {
    expect(
      screen.getByRole("button", { name: /start live detection/i }),
    ).toBeInTheDocument();
  });

  test("camera placeholder is shown", () => {
    expect(screen.getByText(/Camera will appear here/i)).toBeInTheDocument();
  });

  test("idle text shows when no sign detected", () => {
    expect(screen.getByText(/Idle/i)).toBeInTheDocument();
  });

  test("reference grid renders known signs", () => {
    expect(screen.getByText(/HI/i)).toBeInTheDocument();
    expect(screen.getByText(/YES/i)).toBeInTheDocument();
  });
});
