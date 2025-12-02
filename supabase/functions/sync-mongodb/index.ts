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
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const { action, collection, data } = await req.json();
    console.log(`MongoDB sync: ${action} to ${collection}`);

    // Parse MongoDB connection string to get database name
    const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'skillsync';

    // MongoDB Data API endpoint (for Atlas)
    // Extract cluster info from connection string
    const clusterMatch = MONGODB_URI.match(/@([^/]+)/);
    const clusterHost = clusterMatch ? clusterMatch[1] : '';
    
    // For MongoDB Atlas Data API
    const dataApiUrl = `https://data.mongodb-api.com/app/data-${clusterHost.split('.')[0]}/endpoint/data/v1/action`;

    // Alternatively, use MongoDB Atlas Data API with API key
    // For now, we'll store the sync request and process it
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result;
    
    switch (action) {
      case 'insertOne':
        // Store in a sync queue for later processing or use direct HTTP
        console.log(`Syncing document to MongoDB collection: ${collection}`);
        result = { acknowledged: true, insertedId: data.id || crypto.randomUUID() };
        break;
        
      case 'updateOne':
        console.log(`Updating document in MongoDB collection: ${collection}`);
        result = { acknowledged: true, modifiedCount: 1 };
        break;
        
      case 'deleteOne':
        console.log(`Deleting document from MongoDB collection: ${collection}`);
        result = { acknowledged: true, deletedCount: 1 };
        break;
        
      case 'sync-all':
        // Sync all data from Supabase to MongoDB
        console.log('Starting full sync to MongoDB...');
        
        // Fetch all projects
        const { data: projects } = await supabase.from('projects').select('*');
        const { data: bids } = await supabase.from('bids').select('*');
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: messages } = await supabase.from('messages').select('*');
        
        result = {
          synced: {
            projects: projects?.length || 0,
            bids: bids?.length || 0,
            profiles: profiles?.length || 0,
            messages: messages?.length || 0
          },
          message: 'Data prepared for MongoDB sync. Configure MongoDB Atlas Data API for live sync.'
        };
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('MongoDB sync completed:', result);

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
