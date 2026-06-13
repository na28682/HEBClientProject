import type { Member } from "../types";

interface Props {
  members: Member[];
  onlineIds: Set<string>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PresenceBar({ members, onlineIds }: Props) {
  return (
    <div className="presence-strip">
      {members.map((m) => (
        <div
          key={m.user_id}
          className={`avatar ${onlineIds.has(m.user_id) ? "online" : ""}`}
          title={`${m.name}${onlineIds.has(m.user_id) ? " (online)" : ""}`}
        >
          {initials(m.name)}
        </div>
      ))}
    </div>
  );
}
