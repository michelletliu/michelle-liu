import { useState } from "react";
import { SendIcon, SmileyIcon } from "./icons";

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (title: string) => Promise<void>;
}

export function AddBookModal({ onClose, onAddBook }: AddBookModalProps) {
  const [bookTitle, setBookTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (bookTitle.trim() && !isSubmitting) {
      setIsSubmitting(true);
      setIsSubmitted(true);

      // Fire-and-forget: the "Thank you!" state shows immediately
      onAddBook(bookTitle).catch((error) => {
        console.error('Failed to submit book suggestion:', error);
      });

      setTimeout(() => {
        setBookTitle("");
        setIsSubmitted(false);
        setIsSubmitting(false);
        onClose();
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitted && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <>
      {/* Invisible overlay to catch clicks outside the modal */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Modal - positioned below the button, right-aligned with plus button */}
      <div className="absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-[16px] w-[calc(100vw-40px)] sm:w-[420px] max-w-[420px] animate-modal-in">
        <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[16px] shadow-sm" />
        <div className="content-stretch flex flex-col gap-3 items-start p-5 pt-4.5 pb-5 relative w-full">
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-normal relative shrink-0 text-base gap-0 text-black w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="font-normal">
              Have a book suggestion?
              <br />
              <span className="text-gray-500 font-normal">Drop it here! I'll check it out :) </span>
            </p>
          </div>
          
          <div className="content-stretch flex gap-2.5 items-center relative shrink-0 w-full">
            <div className="basis-0 bg-[#f5f5f5] px-1 py-2 grow min-h-px min-w-px relative rounded-[999px] shrink-0">
              <div 
                aria-hidden="true" 
                className={`absolute border-[1.5px] border-solid inset-0 pointer-events-none rounded-[999px] transition-colors duration-300 ${
                  isSubmitted ? "border-[rgba(0,0,0,0.1)]" : "border-blue-500"
                }`}
              />
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[14px] relative size-full">
                  {isSubmitted ? (
                    <div className="content-stretch flex items-center relative shrink-0">
                      <div 
                        className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-base text-blue-500 text-nowrap transition-opacity duration-300"
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
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-base text-[rgba(0,0,0,0.8)] transition-opacity duration-300"
                      style={{ fontVariationSettings: "'wdth' 100" }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!bookTitle.trim() || isSubmitted || isSubmitting}
              className={`flex items-center justify-center border-blue-400 border rounded-full shrink-0 size-[40px] transition-all duration-300 ${
                isSubmitted ? "bg-blue-500" : "bg-blue-500 hover:bg-blue-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center text-white">
                {isSubmitted ? (
                  <SmileyIcon className="w-[20px] h-[20px]" />
                ) : (
                  <SendIcon className="pt-0.5 -ml-0.5 w-[20px] h-[20px]" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
