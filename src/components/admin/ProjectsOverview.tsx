import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  category: string;
  status: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  client: {
    full_name: string;
  };
}

export function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (projectsError) throw projectsError;

      // Fetch client profiles
      const clientIds = projectsData?.map(p => p.client_id) || [];
      const { data: clientsData, error: clientsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", clientIds);

      if (clientsError) throw clientsError;

      // Map clients to projects
      const clientsMap = new Map(clientsData?.map(c => [c.id, c]) || []);
      const projectsWithClients = projectsData?.map(project => ({
        ...project,
        client: clientsMap.get(project.client_id) || { full_name: "Unknown" }
      })) || [];

      setProjects(projectsWithClients);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "secondary";
      case "completed":
        return "outline";
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
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link 
                    to={`/project/${project.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {project.title}
                  </Link>
                </TableCell>
                <TableCell>{project.client?.full_name || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{project.category}</Badge>
                </TableCell>
                <TableCell>
                  ${project.budget_min} - ${project.budget_max}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(project.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
