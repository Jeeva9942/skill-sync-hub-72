import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const Chatbot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the Skill Sync assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: {
          message: userMessage,
          conversationHistory: messages,
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Hide chatbot on messages page
  if (location.pathname === '/messages') {
    return null;
  }

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-glow bg-gradient-hero hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[600px] sm:max-h-[80vh] shadow-premium z-50 flex flex-col border-2 border-primary/20 sm:rounded-lg rounded-none">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-hero text-white sm:rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold text-sm sm:text-base">Skill Sync Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 sm:px-4 py-2 max-w-[80%] sm:max-w-[75%] ${
                      message.role === "user"
                        ? "bg-gradient-hero text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ul]:pl-4 [&>ol]:my-1 [&>ol]:pl-4 [&>li]:my-0.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h1]:font-semibold [&>h2]:font-semibold [&>h3]:font-medium [&>code]:bg-primary/10 [&>code]:px-1 [&>code]:rounded [&>pre]:bg-primary/10 [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>blockquote]:border-l-2 [&>blockquote]:border-primary/50 [&>blockquote]:pl-2 [&>blockquote]:italic">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="rounded-2xl px-3 sm:px-4 py-2 bg-muted">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t bg-card">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-hero"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
