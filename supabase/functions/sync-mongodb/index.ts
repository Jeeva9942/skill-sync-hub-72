import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONGODB_DATA_API_KEY = Deno.env.get('MONGODB_DATA_API_KEY');
    const MONGODB_DATA_API_URL = Deno.env.get('MONGODB_DATA_API_URL');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MONGODB_DATA_API_KEY || !MONGODB_DATA_API_URL) {
      throw new Error('MongoDB Data API credentials not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const { action, collection, data, filter } = await req.json();
    console.log(`MongoDB sync: ${action} to ${collection || 'projects'}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Helper function to make MongoDB Data API requests
    const mongoRequest = async (mongoAction: string, body: object) => {
      const response = await fetch(`${MONGODB_DATA_API_URL}/action/${mongoAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': MONGODB_DATA_API_KEY,
        },
        body: JSON.stringify({
          dataSource: 'Cluster0',
          database: 'skill_sync',
          collection: collection || 'projects',
          ...body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MongoDB API error:', errorText);
        throw new Error(`MongoDB API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    };

    let result;

    switch (action) {
      case 'insertOne':
        console.log(`Inserting document to MongoDB collection: ${collection}`, data);
        result = await mongoRequest('insertOne', { document: data });
        console.log('Insert result:', result);
        break;

      case 'updateOne':
        console.log(`Updating document in MongoDB collection: ${collection}`);
        result = await mongoRequest('updateOne', {
          filter: filter || { _id: data._id || data.id },
          update: { $set: data },
          upsert: true,
        });
        console.log('Update result:', result);
        break;

      case 'deleteOne':
        console.log(`Deleting document from MongoDB collection: ${collection}`);
        result = await mongoRequest('deleteOne', {
          filter: filter || { _id: data._id || data.id },
        });
        console.log('Delete result:', result);
        break;

      case 'sync-projects':
        // Sync all projects with their bids
        console.log('Starting projects sync to MongoDB...');
        
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            client:profiles!projects_client_id_fkey(id, full_name, email, avatar_url),
            freelancer:profiles!projects_freelancer_id_fkey(id, full_name, email, avatar_url)
          `);
        
        if (projectsError) {
          throw new Error(`Failed to fetch projects: ${projectsError.message}`);
        }

        console.log(`Found ${projects?.length || 0} projects to sync`);
        
        const projectResults: Array<{project_id: string; success: boolean; result?: unknown; error?: string}> = [];
        for (const project of projects || []) {
          // Fetch bids for this project
          const { data: bids } = await supabase
            .from('bids')
            .select(`
              *,
              freelancer:profiles!bids_freelancer_id_fkey(id, full_name, email, avatar_url, skills, hourly_rate)
            `)
            .eq('project_id', project.id);

          const projectWithBids = {
            ...project,
            _id: project.id,
            bids: bids || [],
            synced_at: new Date().toISOString(),
          };

          try {
            const insertResult = await mongoRequest('updateOne', {
              filter: { _id: project.id },
              update: { $set: projectWithBids },
              upsert: true,
            });
            projectResults.push({ project_id: project.id, success: true, result: insertResult });
            console.log(`Synced project ${project.id}: ${project.title}`);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Failed to sync project ${project.id}:`, err);
            projectResults.push({ project_id: project.id, success: false, error: errorMessage });
          }
        }

        result = {
          synced: projectResults.filter(r => r.success).length,
          failed: projectResults.filter(r => !r.success).length,
          details: projectResults,
        };
        break;

      case 'sync-project':
        // Sync a single project with its bids
        if (!data?.project_id) {
          throw new Error('project_id is required for sync-project action');
        }

        console.log(`Syncing single project: ${data.project_id}`);

        const { data: singleProject, error: singleProjectError } = await supabase
          .from('projects')
          .select(`
            *,
            client:profiles!projects_client_id_fkey(id, full_name, email, avatar_url),
            freelancer:profiles!projects_freelancer_id_fkey(id, full_name, email, avatar_url)
          `)
          .eq('id', data.project_id)
          .single();

        if (singleProjectError) {
          throw new Error(`Failed to fetch project: ${singleProjectError.message}`);
        }

        const { data: projectBids } = await supabase
          .from('bids')
          .select(`
            *,
            freelancer:profiles!bids_freelancer_id_fkey(id, full_name, email, avatar_url, skills, hourly_rate)
          `)
          .eq('project_id', data.project_id);

        const projectDoc = {
          ...singleProject,
          _id: singleProject.id,
          bids: projectBids || [],
          synced_at: new Date().toISOString(),
        };

        result = await mongoRequest('updateOne', {
          filter: { _id: singleProject.id },
          update: { $set: projectDoc },
          upsert: true,
        });
        console.log(`Synced project ${singleProject.id} with ${projectBids?.length || 0} bids`);
        break;

      case 'sync-bid':
        // Sync a bid and update the parent project
        if (!data?.bid_id || !data?.project_id) {
          throw new Error('bid_id and project_id are required for sync-bid action');
        }

        console.log(`Syncing bid ${data.bid_id} for project ${data.project_id}`);

        // Re-sync the entire project to keep bids array updated
        const { data: bidProject, error: bidProjectError } = await supabase
          .from('projects')
          .select(`
            *,
            client:profiles!projects_client_id_fkey(id, full_name, email, avatar_url),
            freelancer:profiles!projects_freelancer_id_fkey(id, full_name, email, avatar_url)
          `)
          .eq('id', data.project_id)
          .single();

        if (bidProjectError) {
          throw new Error(`Failed to fetch project: ${bidProjectError.message}`);
        }

        const { data: allBids } = await supabase
          .from('bids')
          .select(`
            *,
            freelancer:profiles!bids_freelancer_id_fkey(id, full_name, email, avatar_url, skills, hourly_rate)
          `)
          .eq('project_id', data.project_id);

        const projectWithNewBid = {
          ...bidProject,
          _id: bidProject.id,
          bids: allBids || [],
          synced_at: new Date().toISOString(),
        };

        result = await mongoRequest('updateOne', {
          filter: { _id: bidProject.id },
          update: { $set: projectWithNewBid },
          upsert: true,
        });
        console.log(`Synced project ${bidProject.id} with updated bids`);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('MongoDB sync completed successfully');

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MongoDB sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
