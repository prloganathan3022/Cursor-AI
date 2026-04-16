import type { User } from "../types";

const USERS_KEY = "tm_users";

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is User =>
        typeof u === "object" &&
        u !== null &&
        typeof (u as User).id === "string" &&
        typeof (u as User).email === "string" &&
        typeof (u as User).password === "string" &&
        typeof (u as User).name === "string",
    );
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((u) => u.email.toLowerCase() === normalized);
}

export function createUser(user: Omit<User, "id"> & { id?: string }): User {
  const users = readUsers();
  const newUser: User = {
    id: user.id ?? crypto.randomUUID(),
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    password: user.password,
  };
  if (users.some((u) => u.email.toLowerCase() === newUser.email)) {
    throw new Error("An account with this email already exists");
  }
  writeUsers([...users, newUser]);
  return newUser;
}

export function verifyCredentials(
  email: string,
  password: string,
): User | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}
