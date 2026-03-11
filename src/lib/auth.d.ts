declare module "@/lib/auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
  }

  interface Session {
    user: User;
  }

  export function auth(): Promise<Session | null>;
}
