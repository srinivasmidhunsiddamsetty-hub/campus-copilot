import { PanelLeftIcon, ComposeIcon, ProfileIcon } from "@/components/icons";

export default function Sidebar({
  open,
  onToggle,
  onNewChat,
  recents,
  activeId,
}: {
  open: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  recents: { id: string; title: string }[];
  activeId: string | null;
}) {
  return (
    <aside id="sidebar" className={open ? undefined : "hidden"}>
      <div className="sb-head">
        <button
          className="sb-logo"
          onClick={onNewChat}
          title="New chat"
          aria-label="New chat"
          type="button"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lion.png" alt="Penn State Nittany Lion" />
        </button>
        <button className="sb-tog" onClick={onToggle} title="Close sidebar">
          <PanelLeftIcon />
        </button>
      </div>

      <button className="sb-new" onClick={onNewChat}>
        <ComposeIcon />
        New Chat
      </button>

      <div className="sb-hr" />
      <div className="sb-lbl">Recent</div>

      <div className="sb-hist scroll-sb">
        {recents.map((r) => (
          <div
            className={`sb-item${r.id === activeId ? " active" : ""}`}
            key={r.id}
          >
            {r.title}
          </div>
        ))}
      </div>

      <div className="sb-hr" />
      <div className="sb-foot">
        <div className="sb-fitem">
          <ProfileIcon />
          My Profile
        </div>
      </div>
    </aside>
  );
}
