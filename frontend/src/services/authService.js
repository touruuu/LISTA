import { requireSupabase, supabase } from "./supabaseClient.js";

export function createAuthService(client = supabase) {
  const configuredClient = () => client || requireSupabase();

  async function profileFor(userId) {
    const { data, error } = await configuredClient()
      .from("profiles")
      .select("user_id, role, display_name, mobile_number, created_at")
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(`Your LISTA profile could not be loaded: ${error.message}`);
    return data;
  }

  return {
    async register({ email, password, displayName, mobileNumber = "", role }) {
      if (!["owner", "borrower"].includes(role)) throw new Error("Choose a valid LISTA account role.");
      const cleanName = String(displayName || "").trim();
      if (cleanName.length < 2) throw new Error("Enter your full name.");
      const { data, error } = await configuredClient().auth.signUp({
        email: String(email || "").trim().toLowerCase(),
        password,
        options: {
          data: {
            lista_role: role,
            display_name: cleanName,
            mobile_number: String(mobileNumber || "").trim() || null,
          },
        },
      });
      if (error) throw error;
      const profile = data.session && data.user ? await profileFor(data.user.id) : null;
      return { user: data.user, session: data.session, profile, requiresEmailConfirmation: Boolean(data.user && !data.session) };
    },

    async login({ email, password, expectedRole }) {
      const { data, error } = await configuredClient().auth.signInWithPassword({
        email: String(email || "").trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      const profile = await profileFor(data.user.id);
      if (profile.role !== expectedRole) {
        await configuredClient().auth.signOut();
        throw new Error(`This account is registered as a ${profile.role === "owner" ? "Store Owner" : "Borrower"}. Choose that role to log in.`);
      }
      return { session: data.session, user: data.user, profile };
    },

    async current() {
      const { data, error } = await configuredClient().auth.getSession();
      if (error) throw error;
      if (!data.session?.user) return null;
      return { session: data.session, user: data.session.user, profile: await profileFor(data.session.user.id) };
    },

    async logout() {
      const { error } = await configuredClient().auth.signOut();
      if (error) throw error;
    },

    onChange(callback) {
      if (!client) return { unsubscribe() {} };
      return configuredClient().auth.onAuthStateChange((event, session) => callback(event, session)).data.subscription;
    },
  };
}

export const authService = createAuthService();
