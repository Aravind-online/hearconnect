/**
 * __tests__/speech-page.support.test.jsx
 * SpeechToTextPage: verify it degrades gracefully when Web Speech API is absent.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import SpeechToTextPage from "../pages/SpeechToTextPage";

const renderPage = () => render(<SpeechToTextPage />);

describe("SpeechToTextPage – browser support", () => {
  describe("when SpeechRecognition is NOT available", () => {
    let origSR, origWSR;
    beforeEach(() => {
      origSR = window.SpeechRecognition;
      origWSR = window.webkitSpeechRecognition;
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    });
    afterEach(() => {
      window.SpeechRecognition = origSR;
      window.webkitSpeechRecognition = origWSR;
    });

    test("shows unsupported browser message", () => {
      renderPage();
      expect(
        screen.getByText(/not supported in this browser/i),
      ).toBeInTheDocument();
    });

    test("does NOT render the mic button", () => {
      renderPage();
      expect(
        screen.queryByLabelText(/start listening/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("when SpeechRecognition IS available", () => {
    beforeEach(() => {
      window.SpeechRecognition = class {
        start() {}
        stop() {}
        abort() {}
        addEventListener() {}
        removeEventListener() {}
      };
    });
    afterEach(() => {
      delete window.SpeechRecognition;
    });

    test("renders mic button", () => {
      renderPage();
      expect(screen.getByLabelText(/start listening/i)).toBeInTheDocument();
    });

    test("transcript box is visible with placeholder text", () => {
      renderPage();
      expect(
        screen.getByText(/Transcript will appear here/i),
      ).toBeInTheDocument();
    });

    test("clear button is present", () => {
      renderPage();
      expect(
        screen.getByRole("button", { name: /clear/i }),
      ).toBeInTheDocument();
    });
  });
});
