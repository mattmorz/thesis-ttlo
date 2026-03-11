import { Session } from "next-auth";

export type UserRole = "admin" | "ttlo_staff" | "client";

export interface CustomUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: Date | null;
  phone_number?: string | null;
}

export interface CustomSession extends Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    image: string | null;
    phoneNumber?: string | null;
  };
}
