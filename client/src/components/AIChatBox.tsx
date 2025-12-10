import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, Paperclip, Image, Globe, Mic, Tag, FileText, Zap, ArrowUp } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SuggestedPrompt = {
  text: string;
  icon: 'tag' | 'fileText' | 'zap';
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
   * Can be array of strings or objects with text and icon
   */
  suggestedPrompts?: string[] | SuggestedPrompt[];
};

// Icon mapping
const iconMap = {
  tag: Tag,
  fileText: FileText,
  zap: Zap,
};

/**
 * Modern AI chat box component matching the Cadillac EV design exactly.
 * Features:
 * - Suggested prompts with icons at top (Tag, FileText, Zap)
 * - Icons INSIDE the input field (left: Paperclip, Image; right: Globe, Mic, ArrowUp)
 * - Clean, minimal white background design
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

  // Normalize suggested prompts
  const normalizedPrompts = useMemo(() => {
    if (!suggestedPrompts) return [];
    return suggestedPrompts.map(prompt => 
      typeof prompt === 'string' 
        ? { text: prompt, icon: 'tag' as const }
        : prompt
    );
  }, [suggestedPrompts]);

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
        "flex flex-col bg-white text-gray-900",
        className
      )}
      style={{ height }}
    >
      {/* Suggested Prompts Section - Always visible at top with icons */}
      {normalizedPrompts.length > 0 && (
        <div className="px-6 pt-4 pb-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {normalizedPrompts.map((prompt, index) => {
              const IconComponent = iconMap[prompt.icon];
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestedPromptClick(prompt.text)}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  {IconComponent && <IconComponent className="size-4" />}
                  {prompt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6">
            <p className="text-sm text-gray-500 mb-6">{emptyStateMessage}</p>
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
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                    // Prevent any click events that might trigger errors
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none">
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
                  <div className="rounded-lg bg-gray-100 px-4 py-3">
                    <Loader2 className="size-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area with Icons INSIDE the input field */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="px-4 py-3 bg-white"
      >
        <div className="relative flex items-center">
          {/* Left Icons INSIDE input */}
          <div className="absolute left-3 flex items-center gap-2 z-10">
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Datei anhängen"
              disabled={isLoading}
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Bild hinzufügen"
              disabled={isLoading}
            >
              <Image className="size-4" />
            </button>
          </div>

          {/* Text Input with padding for icons */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 max-h-32 resize-none min-h-[52px] rounded-lg border border-gray-300 bg-white px-20 py-3 pr-24 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={1}
            disabled={isLoading}
          />

          {/* Right Icons INSIDE input */}
          <div className="absolute right-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Sprache"
              disabled={isLoading}
            >
              <Globe className="size-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Spracheingabe"
              disabled={isLoading}
            >
              <Mic className="size-4" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={isLoading ? "Wird gesendet..." : "Nachricht senden"}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
