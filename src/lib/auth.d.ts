declare module "@/lib/auth" {
  interface User {
    id: string;
    name: string;
    email: string;
  }

  interface Session {
    user: User;
  }

  export function auth(): Promise<Session | null>;
}
