import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { HelpCircle, AlertCircle, CheckCircle } from "lucide-react";

const Help = () => {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium"
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket.subject || !ticket.description || !ticket.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: "open"
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Support ticket submitted successfully!",
      });
      
      setTicket({ subject: "", description: "", category: "", priority: "medium" });
      fetchTickets();
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

  const faqs = [
    {
      question: "How do I create a project?",
      answer: "Click on 'Post Project' in the navigation menu, fill in the project details including title, description, budget, and deadline, then submit."
    },
    {
      question: "How do I bid on a project?",
      answer: "Browse available projects, click on a project you're interested in, and submit your bid with your proposed amount and delivery timeline."
    },
    {
      question: "How does payment work?",
      answer: "Payments are processed securely through our platform. Clients pay upfront and funds are held in escrow until the project is completed satisfactorily."
    },
    {
      question: "How can I communicate with clients/freelancers?",
      answer: "Use our built-in messaging system to communicate directly with clients or freelancers. You can access it from the Messages page."
    },
    {
      question: "What if there's a dispute?",
      answer: "If you encounter any issues, you can submit a support ticket here and our team will help mediate and resolve the dispute fairly."
    },
    {
      question: "How do I update my profile?",
      answer: "Go to 'My Profile' from the navigation menu where you can update your information, skills, portfolio, and other details."
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <HelpCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Help & <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Support</span>
            </h1>
            <p className="text-xl text-muted-foreground">We're here to help you succeed</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Submit Ticket */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Submit a Support Ticket</CardTitle>
                    <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={ticket.subject}
                      onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={ticket.category}
                      onValueChange={(value) => setTicket({ ...ticket, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="payment">Payment Issues</SelectItem>
                        <SelectItem value="project">Project Issues</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="dispute">Dispute Resolution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => setTicket({ ...ticket, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={ticket.description}
                      onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                      placeholder="Provide detailed information about your issue..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>My Support Tickets</CardTitle>
                <CardDescription>View and track your support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No support tickets yet
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                            </div>
                            <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'} className="ml-2">
                              <span className="flex items-center gap-1">
                                {getStatusIcon(ticket.status)}
                                {ticket.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {ticket.category}</span>
                            <span>Priority: {ticket.priority}</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Find quick answers to common questions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;
