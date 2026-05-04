type AvatarProps = {
  name: string;
  src: string;
};

export function Avatar({ name, src }: AvatarProps) {
  return <img alt={name} src={src} />;
}

type RolePillProps = {
  role: "admin" | "member";
};

export function RolePill({ role }: RolePillProps) {
  return <span>{role === "admin" ? "Administrator" : "Member"}</span>;
}

type UserSummaryProps = {
  user: {
    name: string;
    role: "admin" | "member";
    avatarUrl: string;
  };
};

export function UserSummary({ user }: UserSummaryProps) {
  return (
    <article>
      <Avatar name={user.name} src={user.avatarUrl} />
      <h2>{user.name}</h2>
      <RolePill role={user.role} />
    </article>
  );
}
