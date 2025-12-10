import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, Paperclip, Image, Globe, Mic } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {
  /**
   * Messages array to display in the chat.
   * Should match the format used by invokeLLM on the server.
   */
  messages: Message[];

  /**
   * Callback when user sends a message.
   * Typically you'll call a tRPC mutation here to invoke the LLM.
   */
  onSendMessage: (content: string) => void;

  /**
   * Whether the AI is currently generating a response
   */
  isLoading?: boolean;

  /**
   * Placeholder text for the input field
   */
  placeholder?: string;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Height of the chat box (default: 600px)
   */
  height?: string | number;

  /**
   * Empty state message to display when no messages
   */
  emptyStateMessage?: string;

  /**
   * Suggested prompts to display (always visible at top)
   * Click to send directly
   */
  suggestedPrompts?: string[];
};

/**
 * Modern AI chat box component with suggested prompts at top and icon-rich input.
 * Designed like modern AI chat interfaces (ChatGPT/Cadillac EV style).
 *
 * Features:
 * - Suggested prompts always visible at top
 * - Icon-rich input field (Paperclip, Image, Globe, Mic, Send)
 * - Clean, minimal design
 * - Markdown rendering with Streamdown
 * - Auto-scrolls to latest message
 * - Loading states
 * - Non-clickable message bubbles (prevents accidental logout)
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Nachricht eingeben...",
  className,
  height = "600px",
  emptyStateMessage = "Beginne eine Unterhaltung mit dem AI Assistenten",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter out system messages
  const displayMessages = useMemo(() => 
    messages.filter((msg) => msg.role !== "system"), 
    [messages]
  );

  // Scroll to bottom helper function with smooth animation
  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayMessages.length, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");

    // Scroll immediately after sending
    scrollToBottom();

    // Keep focus on input
    textareaRef.current?.focus();
  }, [input, isLoading, onSendMessage, scrollToBottom]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleSuggestedPromptClick = useCallback((prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
    scrollToBottom();
  }, [isLoading, onSendMessage, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-background text-foreground",
        className
      )}
      style={{ height }}
    >
      {/* Suggested Prompts Section - Always visible at top */}
      {suggestedPrompts && suggestedPrompts.length > 0 && (
        <div className="px-6 pt-4 pb-3 border-b bg-background">
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPromptClick(prompt)}
                disabled={isLoading}
                className="rounded-lg border border-border bg-card hover:bg-accent px-4 py-2 text-sm font-medium text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6">
            <p className="text-sm text-muted-foreground mb-6">{emptyStateMessage}</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col p-6 space-y-4">
              {displayMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-4",
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-3 select-text",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                    // Prevent any click events that might trigger errors
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-4 justify-start">
                  <div className="rounded-lg bg-muted px-4 py-3">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area with Icons */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="border-t bg-background px-4 py-3"
      >
        <div className="flex items-end gap-2">
          {/* Left Icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              aria-label="Datei anhängen"
              disabled={isLoading}
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              aria-label="Bild hinzufügen"
              disabled={isLoading}
            >
              <Image className="size-4" />
            </button>
          </div>

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 max-h-32 resize-none min-h-[44px] rounded-lg border-border bg-background px-4 py-3 text-sm"
            rows={1}
            disabled={isLoading}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              aria-label="Sprache"
              disabled={isLoading}
            >
              <Globe className="size-4" />
            </button>
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              aria-label="Spracheingabe"
              disabled={isLoading}
            >
              <Mic className="size-4" />
            </button>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-[44px] w-[44px] rounded-lg"
              aria-label={isLoading ? "Wird gesendet..." : "Nachricht senden"}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
