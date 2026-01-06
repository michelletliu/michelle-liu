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
      <div className="absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-[16px] w-[calc(100vw-40px)] sm:w-[420px] max-w-[420px] animate-modal-in">
        <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[16px] shadow-sm" />
        <div className="content-stretch flex flex-col gap-4 items-start p-[24px] relative w-full">
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-lg text-black w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[25px]">
              Have a book suggestion?
              <br />
              <span className="text-gray-500">Drop it here! I'll check it out :) </span>
            </p>
          </div>
          
          <div className="content-stretch flex gap-2.5 items-center relative shrink-0 w-full">
            <div className="basis-0 bg-[#f5f5f5] grow h-[40px] min-h-px min-w-px relative rounded-[999px] shrink-0">
              <div 
                aria-hidden="true" 
                className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[999px] transition-colors duration-300 ${
                  isSubmitted ? "border-[rgba(0,0,0,0.1)]" : "border-[#2883de]"
                }`}
              />
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[14px] relative size-full">
                  {isSubmitted ? (
                    <div className="content-stretch flex items-center relative shrink-0">
                      <div 
                        className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[15px] text-[#2883de] text-nowrap transition-opacity duration-300"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        <p>Thank you!</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-[15px] text-[rgba(0,0,0,0.8)] transition-opacity duration-300"
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
              className={`flex items-center justify-center rounded-full shrink-0 size-[40px] transition-all duration-300 ${
                isSubmitted ? "bg-[#2883de]" : "bg-[#2883de] hover:bg-[#2070ba]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center text-white">
                {isSubmitted ? (
                  <SmileyIcon className="w-[18px] h-[18px]" />
                ) : (
                  <SendIcon className="w-[18px] h-[18px]" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
