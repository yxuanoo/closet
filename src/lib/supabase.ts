import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请创建 .env.local 文件并添加以下内容：');
  console.warn('VITE_SUPABASE_URL=your-supabase-url');
  console.warn('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type SupabaseUser = {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
};

export const supabaseAuth = {
  signUp: async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#closet`,
    });
    return { data, error };
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export const supabaseData = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: { username?: string; avatar?: string; height?: number; weight?: number; bust?: number; waist?: number; hips?: number }) => {
    const profileResult = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
      
    let username = updates.username;
    if (!username && profileResult.data) {
      username = profileResult.data.username;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, username: username || 'user', ...updates })
      .eq('id', userId);
    return { data, error };
  },

  getClothes: async (userId: string) => {
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  addClothing: async (clothing: any) => {
    const { data, error } = await supabase
      .from('clothes')
      .insert(clothing);
    return { data, error };
  },

  updateClothing: async (id: string, updates: any) => {
    console.log('updateClothing id:', id, 'updates:', updates);
    const { data, error } = await supabase
      .from('clothes')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('updateClothing error:', error);
    }
    return { data, error };
  },

  deleteClothing: async (id: string) => {
    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', id);
    return { error };
  },

  getLocations: async (userId: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  addLocation: async (location: any) => {
    const { data, error } = await supabase
      .from('locations')
      .insert(location);
    return { data, error };
  },

  updateLocation: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id);
    return { data, error };
  },

  deleteLocation: async (id: string) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    return { error };
  },

  getOutfits: async (userId: string) => {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  addOutfit: async (outfit: any) => {
    console.log('addOutfit data:', outfit);
    const { data, error } = await supabase
      .from('outfits')
      .insert(outfit);
    if (error) {
      console.error('addOutfit error:', error);
    }
    return { data, error };
  },

  updateOutfit: async (id: string, updates: any) => {
    console.log('updateOutfit id:', id, 'data:', updates);
    const { data, error } = await supabase
      .from('outfits')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('updateOutfit error:', error);
    }
    return { data, error };
  },

  deleteOutfit: async (id: string) => {
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', id);
    return { error };
  },

  getCheckins: async (userId: string) => {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  addCheckin: async (checkin: any) => {
    console.log('addCheckin - saving checkin:', checkin);
    const { data, error } = await supabase
      .from('checkins')
      .upsert(checkin, { onConflict: ['user_id', 'date'] });
    console.log('addCheckin - result:', { data, error });
    return { data, error };
  },

  updateCheckin: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('checkins')
      .update(updates)
      .eq('id', id);
    return { data, error };
  },

  deleteCheckin: async (date: string, userId?: string) => {
    console.log('deleteCheckin - date:', date, 'userId:', userId);
    let query = supabase
      .from('checkins')
      .delete()
      .eq('date', date);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    console.log('deleteCheckin - result:', { error });
    return { error };
  },
};
