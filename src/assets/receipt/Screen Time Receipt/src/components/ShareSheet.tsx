import { X } from "lucide-react";

type ShareSheetProps = {
  onClose: () => void;
};

export function ShareSheet({ onClose }: ShareSheetProps) {
  const contacts = [
    { name: "Ashley", emoji: "👩" },
    { name: "Jordan", emoji: "👨" },
    { name: "Gary and Tasha", emoji: "👫" },
    { name: "Steven", emoji: "🧑" },
  ];

  const shareApps = [
    { name: "AirDrop", icon: "📱", color: "bg-blue-500" },
    { name: "Messages", icon: "💬", color: "bg-green-500" },
    { name: "Mail", icon: "📧", color: "bg-blue-400" },
    { name: "Notes", icon: "📝", color: "bg-yellow-300" },
  ];

  const actions = [
    { name: "Copy", icon: "📋" },
    { name: "Add to Favorites", icon: "⭐" },
    { name: "Add to Reading List", icon: "👓" },
    { name: "Add Bookmark", icon: "📖" },
  ];

  const handleAction = (actionName: string) => {
    alert(`${actionName} clicked! (This is a demo)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[20px] w-full max-w-[402px] pb-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h3 className="font-['SF_Mono:Semibold',sans-serif] text-[15px]">Screen Time Receipt</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-center text-[13px] text-zinc-500 font-['SF_Mono:Regular',sans-serif] py-2">Weekly Time Summary</p>
        
        <div className="px-4 py-3">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {contacts.map((contact, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-3xl">
                  {contact.emoji}
                </div>
                <span className="text-[11px] text-zinc-700 font-['SF_Pro:Regular',sans-serif] truncate w-full text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-100">
          <div className="flex gap-4 justify-around">
            {shareApps.map((app, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-[60px] h-[60px] rounded-[15px] ${app.color} flex items-center justify-center text-3xl shadow-sm`}>
                  {app.icon}
                </div>
                <span className="text-[11px] text-zinc-700 font-['SF_Pro:Regular',sans-serif]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-100 space-y-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              className="flex items-center gap-3 w-full py-3 px-2 hover:bg-zinc-100 rounded-lg transition-colors"
              onClick={() => handleAction(action.name)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-[15px] text-zinc-900 font-['SF_Pro:Regular',sans-serif]" style={{ fontVariationSettings: "'wdth' 100" }}>
                {action.name}
              </span>
            </button>
          ))}
        </div>

        <div className="px-4 pt-3">
          <p className="text-[11px] text-zinc-500 font-['SF_Mono:Regular',sans-serif] text-center">
            􀇾 Add to Reading List
          </p>
          <p className="text-[11px] text-zinc-500 font-['SF_Mono:Regular',sans-serif] text-center mt-1">
            📚 Add Bookmark
          </p>
        </div>
      </div>
    </div>
  );
}