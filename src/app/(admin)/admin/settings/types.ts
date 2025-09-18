export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  projectUpdates: boolean;
  taskAssignments: boolean;
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: Date;
  icon: React.ReactNode;
}
