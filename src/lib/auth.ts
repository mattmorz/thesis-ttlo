// This is a mock auth module for development
// It simulates a user session for testing purposes

type User = {
  id: string;
  name: string;
  email: string;
};

type Session = {
  user: User;
};

// Mock user for testing
const mockUser: User = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
};

// Mock auth function that returns a session
export const auth = async (): Promise<Session | null> => {
  // In a real app, this would check the session
  // For testing, we'll always return a mock session
  return {
    user: mockUser,
  };
};
