import { X } from "lucide-react";

type UploadInstructionsProps = {
  onClose: () => void;
};

export function UploadInstructions({ onClose }: UploadInstructionsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0px_4px_20px_0px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4 rounded-t-[20px]">
          <h2 className="font-['SF_Mono:Semibold',sans-serif] text-[17px] text-black">Upload Your Screen Time Data</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-6 space-y-6 font-['SF_Mono:Regular',sans-serif] text-[15px]">
          <div className="space-y-3">
            <h3 className="font-['SF_Mono:Semibold',sans-serif] text-[15px] text-black">📱 For iPhone Users:</h3>
            <ol className="space-y-3 pl-5 list-decimal text-[rgba(0,0,0,0.8)] leading-[22px]">
              <li>Open the <strong>Settings</strong> app on your iPhone</li>
              <li>Scroll down and tap <strong>Screen Time</strong></li>
              <li>Tap <strong>See All Activity</strong></li>
              <li>Choose <strong>Week</strong> or <strong>Day</strong> at the top</li>
              <li>Take a screenshot (Press Side Button + Volume Up)</li>
              <li>Return here and click <strong>"Upload Screenshot"</strong> below</li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3">
            <h3 className="font-['SF_Mono:Semibold',sans-serif] text-[15px] text-black">🤖 For Android Users:</h3>
            <ol className="space-y-3 pl-5 list-decimal text-[rgba(0,0,0,0.8)] leading-[22px]">
              <li>Open the <strong>Settings</strong> app</li>
              <li>Tap <strong>Digital Wellbeing & parental controls</strong></li>
              <li>Tap the graph to see your screen time details</li>
              <li>Take a screenshot (usually Power + Volume Down)</li>
              <li>Return here and click <strong>"Upload Screenshot"</strong> below</li>
            </ol>
          </div>

          <div className="bg-[rgba(116,116,128,0.08)] rounded-[12px] p-4 space-y-2">
            <p className="font-['SF_Mono:Semibold',sans-serif] text-[13px] text-[#8e8e93]">💡 Note:</p>
            <p className="text-[13px] text-[rgba(0,0,0,0.6)] leading-[20px]">
              Currently, screenshot upload is a demo feature. The app will use sample data to generate your receipt. 
              Full OCR/parsing functionality is coming soon!
            </p>
          </div>

          <label className="block">
            <div className="bg-[#404040] hover:bg-[#333] transition-colors content-stretch flex items-center justify-center px-[20px] py-[12px] rounded-[999px] cursor-pointer">
              <p className="font-['SF_Mono:Regular',sans-serif] text-[15px] text-center text-white tracking-[0.75px]">
                UPLOAD SCREENSHOT
              </p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  alert('Screenshot received! Generating receipt with sample data...');
                  onClose();
                }
              }}
            />
          </label>

          <button
            onClick={onClose}
            className="w-full text-center text-[15px] text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.7)] transition-colors py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
