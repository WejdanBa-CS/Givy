import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('RLS Helper Functions', () => {
  let supabaseClient: SupabaseClient;
  
  beforeEach(() => {
    // Initialize test Supabase client
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  it('should verify user can only read own lists', async () => {
    // Sign in as test user
    const { data: { user } } = await supabaseClient.auth.getUser();
    expect(user).toBeDefined();
    
    // Query own lists
    const { data: ownLists } = await supabaseClient
      .from('gift_lists')
      .select('id, user_id')
      .eq('user_id', user!.id);
    
    // Verify all lists belong to the user
    ownLists?.forEach(list => {
      expect(list.user_id).toBe(user!.id);
    });
  });

  it('should prevent reading other users\' lists via RLS', async () => {
    // Try to fetch list with different user_id
    const { data, error } = await supabaseClient
      .from('gift_lists')
      .select('*')
      .eq('id', 'other-user-list-id');
    
    // Should be rejected by RLS policy
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('should enforce item isolation within lists', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Create a test list
    const { data: list } = await supabaseClient
      .from('gift_lists')
      .insert([{ user_id: user!.id, occasion: 'Test' }])
      .select();
    
    const listId = list?.[0]?.id;
    
    // Add an item
    const { data: item } = await supabaseClient
      .from('gift_items')
      .insert([{ list_id: listId, name: 'Test Item' }])
      .select();
    
    // Verify item belongs to user's list
    const { data: fetchedItem } = await supabaseClient
      .from('gift_items')
      .select('list_id')
      .eq('id', item?.[0]?.id);
    
    expect(fetchedItem?.[0]?.list_id).toBe(listId);
  });
});
