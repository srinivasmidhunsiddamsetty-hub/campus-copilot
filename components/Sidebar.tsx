import { PanelLeftIcon, ComposeIcon, ProfileIcon } from "@/components/icons";

const RECENT = ["Late-Night Food Options", "Health Center Appointment"];

export default function Sidebar({
  open,
  onToggle,
  onNewChat,
}: {
  open: boolean;
  onToggle: () => void;
  onNewChat: () => void;
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
        {RECENT.map((t, i) => (
          <div className={`sb-item${i === 0 ? " active" : ""}`} key={i}>
            {t}
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
