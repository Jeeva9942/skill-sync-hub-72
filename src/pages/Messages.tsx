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
import { Send, MessageSquare } from "lucide-react";

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
      // Get unique conversation partners
      const { data: sentMessages, error: sentError } = await supabase
        .from("messages")
        .select("receiver_id, profiles!messages_receiver_id_fkey(id, full_name, avatar_url)")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      const { data: receivedMessages, error: receivedError } = await supabase
        .from("messages")
        .select("sender_id, profiles!messages_sender_id_fkey(id, full_name, avatar_url)")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (sentError || receivedError) throw sentError || receivedError;

      // Combine and deduplicate conversations
      const allConversations = new Map();
      
      sentMessages?.forEach((msg: any) => {
        if (msg.profiles) {
          allConversations.set(msg.receiver_id, msg.profiles);
        }
      });
      
      receivedMessages?.forEach((msg: any) => {
        if (msg.profiles && !allConversations.has(msg.sender_id)) {
          allConversations.set(msg.sender_id, msg.profiles);
        }
      });

      setConversations(Array.from(allConversations.values()));
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
        .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)")
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
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Messages</span>
            </h1>
            <p className="text-xl text-muted-foreground">Chat with clients and freelancers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="p-4 text-center">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={conversation.avatar_url} />
                              <AvatarFallback>{conversation.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{conversation.full_name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2">
              <CardHeader>
                {selectedConversation ? (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.avatar_url} />
                      <AvatarFallback>{selectedConversation.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{selectedConversation.full_name}</CardTitle>
                  </div>
                ) : (
                  <CardTitle>Select a conversation</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="flex flex-col h-[450px]">
                    <ScrollArea className="flex-1 pr-4 mb-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.sender_id === user.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    Select a conversation to start messaging
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Messages;
