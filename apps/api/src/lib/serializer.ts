export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  password?: string | null;
};

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? "user",
  };
}
