import { useState, useRef, useCallback } from "react";
import { SendIcon, SmileyIcon } from "./icons";
import { posthog, posthogEnabled } from "../../lib/posthog";

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (title: string, senderNote?: string) => Promise<void>;
}

export function AddBookModal({ onClose, onAddBook }: AddBookModalProps) {
  const [bookTitle, setBookTitle] = useState("");
  const [senderNote, setSenderNote] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const [focusedField, setFocusedField] = useState<"title" | "note">("title");
  const hasTitle = bookTitle.trim().length > 0;

  const animateClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 180);
  }, [isClosing, onClose]);

  const handleSubmit = () => {
    if (!hasTitle || isSubmitting) return;

    setIsSubmitting(true);
    setIsSubmitted(true);

    if (posthogEnabled) {
      posthog.capture("book_suggestion_submitted", {
        title_length: bookTitle.trim().length,
        has_note: !!senderNote.trim(),
      });
    }

    onAddBook(bookTitle, senderNote).catch((error) => {
      console.error("Failed to submit book suggestion:", error);
    });

    setTimeout(() => {
      animateClose();
    }, 1600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasTitle && !isSubmitting) {
      handleSubmit();
    }
  };

  const inputBorderClass = (active: boolean) =>
    `absolute border-[1.5px] border-solid inset-0 pointer-events-none rounded-[999px] transition-colors duration-300 ${
      isSubmitted ? "border-[rgba(0,0,0,0.1)]" : active ? "border-[rgba(0,0,0,0.1)]" : "border-transparent"
    }`;

  const inputFont = { fontVariationSettings: "'wdth' 100" } as const;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={animateClose} />

      <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-[16px] w-[calc(100vw-64px)] sm:w-[420px] max-w-[420px] ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
        <div
          aria-hidden="true"
          className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[16px] shadow-sm"
        />
        <div className="content-stretch flex flex-col gap-3 items-start p-5 pt-4.5 pb-5 relative w-full">
          <div
            className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-normal relative shrink-0 text-base gap-0 text-black w-full"
            style={inputFont}
          >
            <p className="font-normal">
              Have a book suggestion?
              <br />
              <span className="text-gray-500 font-normal">Drop it here! I'll check it out :) </span>
            </p>
          </div>

          {/* Book Title Row */}
          <div className="content-stretch flex gap-2.5 items-center relative shrink-0 w-full">
            <div className="basis-0 bg-[#f5f5f5] px-1 py-2 grow min-h-px min-w-px relative rounded-[999px] shrink-0">
              <div aria-hidden="true" className={inputBorderClass(focusedField === "title")} />
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[14px] relative size-full">
                  {isSubmitted ? (
                    <div
                      className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-base text-blue-500 text-nowrap transition-opacity duration-300"
                      style={inputFont}
                    >
                      <p>Thank you!</p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedField("title")}
                      placeholder="Book Title"
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-base text-[rgba(0,0,0,0.8)] placeholder:text-gray-400 transition-opacity duration-300"
                      style={inputFont}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
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

          {/* Note Field — revealed after title is entered */}
          {hasTitle && !isSubmitted && (
            <div className="flex flex-col w-full animate-note-field-in pt-1.5">
              <div className="h-px bg-gray-100 w-[calc(100%+40px)] -mx-5" />
              <p
                className="font-['SF_Pro:Regular',sans-serif] font-normal text-base text-black mt-3"
                style={inputFont}
              >
                Add your name, email, or a note?
              </p>
              <div className="bg-[#f5f5f5] px-1 py-2 min-h-[40px] relative rounded-[999px] mt-3">
                <div aria-hidden="true" className={inputBorderClass(focusedField === "note")} />
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[14px] relative size-full">
                    <input
                      ref={noteInputRef}
                      type="text"
                      value={senderNote}
                      onChange={(e) => setSenderNote(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedField("note")}
                      placeholder="Say Hi"
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-base text-[rgba(0,0,0,0.8)] placeholder:text-gray-400 transition-opacity duration-300"
                      style={inputFont}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
