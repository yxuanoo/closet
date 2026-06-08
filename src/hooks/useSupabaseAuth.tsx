import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase, supabaseAuth, supabaseData, SupabaseUser } from '../lib/supabase';

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        const profile = await supabaseData.getProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: profile.data?.username || session.user.email?.split('@')[0],
          avatar: profile.data?.avatar,
        });
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabaseAuth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await supabaseData.getProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: profile.data?.username || session.user.email?.split('@')[0],
            avatar: profile.data?.avatar,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    const { data, error } = await supabaseAuth.signUp(email, password, username);
    if (error) return { error };
    
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        username: username || email.split('@')[0],
      });
    }
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseAuth.signIn(email, password);
    if (error) return { error };
    
    if (data.user) {
      const profile = await supabaseData.getProfile(data.user.id);
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        username: profile.data?.username || data.user.email?.split('@')[0],
        avatar: profile.data?.avatar,
      });
    }
    
    return { error: null };
  };

  const signOut = async () => {
    await supabaseAuth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
