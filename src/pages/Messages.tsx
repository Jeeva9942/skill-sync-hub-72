import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Send, MessageSquare, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchConversations = async () => {
    try {
      // Fetch all messages where current user is either sender or receiver
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Build unique partner ids keeping latest order
      const partnerOrder: string[] = [];
      const seen = new Set<string>();
      (data || []).forEach((m: any) => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!seen.has(partnerId)) {
          seen.add(partnerId);
          partnerOrder.push(partnerId);
        }
      });

      if (partnerOrder.length === 0) {
        setConversations([]);
        return;
      }

      // Fetch partner profiles in one query
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", partnerOrder);

      if (profilesError) throw profilesError;

      // Keep original ordering
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const ordered = partnerOrder
        .map((id) => profileMap.get(id))
        .filter(Boolean);

      setConversations(ordered as any[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationPartnerId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", conversationPartnerId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const msg = payload.new as any;
          // Only handle messages related to current user
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            // If current conversation is open with this partner, append
            const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            if (!selectedConversation || selectedConversation.id === partnerId) {
              setMessages((prev) => [...prev, msg]);
            }
            // Refresh conversations to ensure new partner appears
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const clearChat = async () => {
    if (!selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.id}),and(sender_id.eq.${selectedConversation.id},receiver_id.eq.${user.id})`);

      if (error) throw error;

      setMessages([]);
      toast({
        title: "Chat cleared",
        description: "All messages have been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage("");
      fetchMessages(selectedConversation.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      {/* WhatsApp-style Messages Container */}
      <div className="flex-1 flex pt-20 md:pt-24 overflow-hidden">
        <div className="w-full h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex">
          
          {/* Conversations Sidebar */}
          <div className={`${selectedConversation && 'hidden md:flex'} w-full md:w-96 border-r border-border bg-background flex flex-col`}>
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/50">
              <h2 className="text-xl font-semibold">Messages</h2>
            </div>
            
            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a conversation with clients or freelancers</p>
                </div>
              ) : (
                <div>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={conversation.avatar_url} />
                          <AvatarFallback className="bg-gradient-hero text-white font-semibold">
                            {conversation.full_name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm">{conversation.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">Tap to view conversation</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`${!selectedConversation && 'hidden md:flex'} flex-1 flex flex-col bg-background`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={selectedConversation.avatar_url} />
                      <AvatarFallback className="bg-gradient-hero text-white font-semibold">
                        {selectedConversation.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{selectedConversation.full_name}</p>
                      <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all messages with {selectedConversation.full_name}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Clear Chat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] bg-muted/20">
                  <div className="space-y-3 pb-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwnMessage = message.sender_id === user.id;
                        const showTime = index === 0 || 
                          (new Date(messages[index].created_at).getTime() - new Date(messages[index - 1].created_at).getTime()) > 300000;
                        
                        return (
                          <div key={message.id}>
                            {showTime && (
                              <div className="flex justify-center my-2">
                                <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                                  {new Date(message.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                    ? 'Today'
                                    : new Date(message.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                  isOwnMessage
                                    ? 'bg-gradient-hero text-white rounded-br-sm'
                                    : 'bg-background border border-border rounded-bl-sm'
                                }`}
                              >
                                <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                                <div className={`flex items-center gap-1 justify-end mt-1 ${
                                  isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
                                }`}>
                                  <span className="text-xs">
                                    {new Date(message.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {isOwnMessage && (
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex gap-2 items-end">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 rounded-full px-4 py-2 h-auto min-h-[44px] bg-muted/50 border-border focus-visible:ring-primary"
                    />
                    <Button 
                      onClick={sendMessage} 
                      size="icon"
                      className="rounded-full h-11 w-11 bg-gradient-hero hover:opacity-90 transition-opacity shrink-0"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
                <div className="p-6 bg-gradient-hero/10 rounded-full mb-6">
                  <MessageSquare className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Select a conversation from the sidebar to start chatting with clients and freelancers
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
