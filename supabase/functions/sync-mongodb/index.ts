import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MONGODB_URI) {
      console.log('MongoDB URI not configured - sync disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'MongoDB sync is disabled (credentials not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const { action, collection, data, filter } = await req.json();
    console.log(`MongoDB sync: ${action} to ${collection || 'projects'}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Connect to MongoDB using the Deno driver
    console.log('Connecting to MongoDB...');
    const client = new MongoClient();
    await client.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = client.database('skill_sync');
    const projectsCollection = db.collection('projects');

    let result;

    switch (action) {
      case 'insertOne':
        console.log(`Inserting document to MongoDB collection: ${collection || 'projects'}`, data);
        result = await projectsCollection.insertOne(data);
        console.log('Insert result:', result);
        break;

      case 'updateOne':
        console.log(`Updating document in MongoDB collection: ${collection || 'projects'}`);
        const updateFilter = filter || { _id: data._id || data.id };
        result = await projectsCollection.updateOne(
          updateFilter,
          { $set: data },
          { upsert: true }
        );
        console.log('Update result:', result);
        break;

      case 'deleteOne':
        console.log(`Deleting document from MongoDB collection: ${collection || 'projects'}`);
        const deleteFilter = filter || { _id: data._id || data.id };
        result = await projectsCollection.deleteOne(deleteFilter);
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
            const syncResult = await projectsCollection.updateOne(
              { _id: project.id },
              { $set: projectWithBids },
              { upsert: true }
            );
            projectResults.push({ project_id: project.id, success: true, result: syncResult });
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

        result = await projectsCollection.updateOne(
          { _id: singleProject.id },
          { $set: projectDoc },
          { upsert: true }
        );
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

        result = await projectsCollection.updateOne(
          { _id: bidProject.id },
          { $set: projectWithNewBid },
          { upsert: true }
        );
        console.log(`Synced project ${bidProject.id} with updated bids`);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Close MongoDB connection
    client.close();
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
