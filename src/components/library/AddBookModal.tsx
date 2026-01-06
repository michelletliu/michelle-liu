import { useState } from "react";
import { SendIcon, SmileyIcon } from "./icons";

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (title: string) => void;
}

export function AddBookModal({ onClose, onAddBook }: AddBookModalProps) {
  const [bookTitle, setBookTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (bookTitle.trim()) {
      onAddBook(bookTitle);
      setIsSubmitted(true);
      
      // Auto-close after showing thank you message
      setTimeout(() => {
        setBookTitle("");
        setIsSubmitted(false);
        onClose();
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitted) {
      handleSubmit();
    }
  };

  return (
    <>
      {/* Modal - positioned below the button, right-aligned with plus button */}
      <div className="absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-[16px] w-[calc(100vw-40px)] sm:w-[420px] max-w-[420px] animate-in fade-in slide-in-from-top-2 duration-300">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.2)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]" />
        <div className="content-stretch flex flex-col gap-[23px] items-start p-[24px] relative w-full">
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[20px] text-black w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[25px]">
              Have a book suggestion?
              <br />
              <span className="text-[rgba(0,0,0,0.6)]">Drop it here!</span>
            </p>
          </div>
          
          <div className="content-stretch flex gap-3 items-center relative shrink-0 w-full">
            <div className="basis-0 bg-[#f5f5f5] grow h-[44px] min-h-px min-w-px relative rounded-[999px] shrink-0">
              <div 
                aria-hidden="true" 
                className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[999px] transition-colors duration-300 ${
                  isSubmitted ? "border-[rgba(0,0,0,0.1)]" : "border-[#2883de]"
                }`}
              />
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[20px] py-[16px] relative size-full">
                  {isSubmitted ? (
                    <div className="content-stretch flex items-end relative shrink-0">
                      <div 
                        className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[20px] text-[#2883de] text-nowrap transition-opacity duration-300"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        <p className="leading-[25px]">Thank you!</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-[20px] text-[rgba(0,0,0,0.8)] leading-[0] transition-opacity duration-300"
                      style={{ fontVariationSettings: "'wdth' 100" }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!bookTitle.trim() || isSubmitted}
              className={`flex items-center justify-center rounded-[1000px] shrink-0 size-[44px] transition-all duration-300 ${
                isSubmitted ? "bg-[#2883de]" : "bg-[#2883de] hover:bg-[#2070ba]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center text-white">
                {isSubmitted ? (
                  <SmileyIcon className="w-[20px] h-[20px]" />
                ) : (
                  <SendIcon className="w-[20px] h-[20px]" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
