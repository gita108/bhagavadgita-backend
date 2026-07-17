const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

let supabase = null;

function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not configured');
    return null;
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: WebSocket
    }
  });
  console.log('✅ Supabase client initialized');
  return supabase;
}

function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabase;
}

module.exports = { initSupabase, getSupabase };
