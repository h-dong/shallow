export type CurrentUser = {
  name: string;
  role: "admin" | "member";
};

export function useCurrentUser(): CurrentUser | null {
  return null;
}
