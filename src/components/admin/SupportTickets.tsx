import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (ticketsError) throw ticketsError;

      // Fetch user profiles for the tickets
      const userIds = ticketsData?.map(t => t.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Map users to tickets
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
      const ticketsWithUsers = ticketsData?.map(ticket => ({
        ...ticket,
        user: usersMap.get(ticket.user_id) || { full_name: "Unknown", email: "" }
      })) || [];

      setTickets(ticketsWithUsers);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    try {
      setActionLoading(ticketId);
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "resolved" })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket marked as resolved",
      });

      await fetchTickets();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{ticket.user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{ticket.user?.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {ticket.status === "open" && (
                    <Button
                      size="sm"
                      onClick={() => resolveTicket(ticket.id)}
                      disabled={actionLoading === ticket.id}
                    >
                      {actionLoading === ticket.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
