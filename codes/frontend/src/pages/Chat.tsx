import { useEffect, useState } from "react";

import { sendChatMessage } from "../api/chat";
import { AutoPatientMessage } from "../api/state";

export type ChatMessage = {
  id: string;
  speaker: "student" | "patient";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "initial-patient-message",
    speaker: "patient",
    text: "I cannot catch my breath. Can you help me?",
  },
];

type ChatProps = {
  embedded?: boolean;
  autoPatientMessage?: AutoPatientMessage | null;
  persistedMessages?: ChatMessage[];
  onMessageSent?: () => Promise<void> | void;
  statusLabel?: string;
};

export function Chat({
  embedded = false,
  autoPatientMessage = null,
  persistedMessages,
  onMessageSent,
  statusLabel = "Backend mock",
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!persistedMessages) {
      return;
    }

    setMessages(persistedMessages.length > 0 ? persistedMessages : initialMessages);
  }, [persistedMessages]);

  useEffect(() => {
    if (!autoPatientMessage || persistedMessages) {
      return;
    }

    const patientMessage: ChatMessage = {
      id: autoPatientMessage.message_id,
      speaker: "patient",
      text: autoPatientMessage.text,
    };

    setMessages((currentMessages) => {
      const messageAlreadyExists = currentMessages.some(
        (message) => message.id === patientMessage.id,
      );

      if (messageAlreadyExists) {
        return currentMessages;
      }

      return [...currentMessages, patientMessage];
    });
  }, [autoPatientMessage]);

  async function handleSubmit(formData: FormData) {
    const submittedMessage = formData.get("message");
    const trimmedMessage =
      typeof submittedMessage === "string" ? submittedMessage.trim() : "";

    if (!trimmedMessage || isSending) {
      return;
    }

    const submittedAt = Date.now();
    const studentMessage: ChatMessage = {
      id: `student-${submittedAt}`,
      speaker: "student",
      text: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, studentMessage]);
    setMessageInput("");
    setErrorMessage("");
    setIsSending(true);

    try {
      const response = await sendChatMessage(trimmedMessage);
      const patientMessage: ChatMessage = {
        id: `patient-${submittedAt}`,
        speaker: "patient",
        text: response.reply,
      };

      setMessages((currentMessages) => [...currentMessages, patientMessage]);
      await onMessageSent?.();
    } catch {
      setErrorMessage("Patient response failed. Make sure the backend is running.");
    } finally {
      setIsSending(false);
    }
  }

  const chatPanel = (
    <section className="chat-panel" aria-labelledby="chat-title">
        <header className="chat-header">
          <div>
            <p className="eyebrow">COPD/SOB scenario</p>
            <h1 id="chat-title">Text Patient Persona</h1>
          </div>
          <span className="scenario-badge">{statusLabel}</span>
        </header>

        <div className="conversation" aria-live="polite">
          {messages.map((message) => (
            <article
              className={`message message-${message.speaker}`}
              key={message.id}
            >
              <p className="message-speaker">
                {message.speaker === "patient" ? "Patient" : "Student"}
              </p>
              <p className="message-text">{message.text}</p>
            </article>
          ))}
          {isSending ? (
            <article className="message message-patient message-pending">
              <p className="message-speaker">Patient</p>
              <p className="message-text">...</p>
            </article>
          ) : null}
        </div>

        {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}

        <form action={handleSubmit} className="chat-form">
          <label className="sr-only" htmlFor="chat-message">
            Student message
          </label>
          <input
            id="chat-message"
            name="message"
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Ask the patient a question..."
            type="text"
            value={messageInput}
            disabled={isSending}
          />
          <button disabled={isSending} type="submit">
            {isSending ? "Sending" : "Send"}
          </button>
        </form>
      </section>
  );

  if (embedded) {
    return chatPanel;
  }

  return (
    <main className="app-shell chat-shell">
      {chatPanel}
    </main>
  );
}
