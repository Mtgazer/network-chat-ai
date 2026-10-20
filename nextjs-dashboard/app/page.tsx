
'use client';

import { FormEvent, useState } from 'react';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  matchedQuestion?: string;
  similarity?: number;
};

type ChatResponse = {
  answer: string | null;
  message?: string;
  matched_question?: string;
  similarity?: number;
};

export default function Page() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = question.trim();

    if (!text || loading) return;

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: 'user',
        content: text,
      },
    ]);

    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data: ChatResponse = await response.json();

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            data.answer ??
            data.message ??
            'I could not find a relevant answer.',
          matchedQuestion: data.matched_question,
          similarity: data.similarity,
        },
      ]);
    } catch {
      setError(
        'Could not connect to the backend. Make sure FastAPI is running on port 8000.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <div className="brand-mark">N</div>

        <div className="brand-copy">
          <h1>Network Chat AI</h1>
          <p>Your computer networks study assistant</p>
        </div>

        <div className="status-pill">
          <span className="status-dot" />
          Knowledge base
        </div>
      </header>

      <section className="chat-layout">
        <div className="welcome">
          <span className="eyebrow">CCNA • COMPUTER NETWORKS</span>
          <h2>
            Understand networks,
            <br />
            one question at a time.
          </h2>
          <p>
            Ask about OSI layers, DNS, networking protocols, and other
            topics covered by the current knowledge base.
          </p>
        </div>

        <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <h3>Study session</h3>
              <p>Answers retrieved from the CCNA dataset</p>
            </div>
            <span className="chat-indicator">● Ready</span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">↗</div>
                <h3>What would you like to learn?</h3>
                <p>Try one of these questions to get started.</p>

                <div className="suggestions">
                  {[
                    'What are the seven layers of the OSI model?',
                    'What is DNS?',
                    'What is the difference between TCP and UDP?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                      <span>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? 'Y' : 'N'}
                </div>

                <div className="message-content">
                  <span className="message-author">
                    {message.role === 'user' ? 'You' : 'Network AI'}
                  </span>
                  <div className="message-bubble">{message.content}</div>

                  {message.matchedQuestion && (
                    <div className="source-info">
                      <span>Retrieved from dataset</span>
                      <p>{message.matchedQuestion}</p>
                      {message.similarity !== undefined && (
                        <small>
                          Text similarity: {message.similarity.toFixed(3)}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="loading-message" role="status">
                <span className="loading-dots">
                  <i />
                  <i />
                  <i />
                </span>
                Searching the knowledge base...
              </div>
            )}
          </div>

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}

          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="question">
              Your networking question
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask a networking question..."
              rows={2}
              maxLength={1000}
              disabled={loading}
            />

            <div className="composer-footer">
              <span>Enter to send · Shift + Enter for a new line</span>
              <button
                type="submit"
                disabled={loading || question.trim().length < 2}
              >
                {loading ? 'Searching...' : 'Send question'}
                <span>↑</span>
              </button>
            </div>
          </form>

          <p className="disclaimer">
            Answers are retrieved from the available dataset and may not
            cover every question.
          </p>
        </div>
      </section>
    </main>
  );
}
