import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { SendIcon, SmileyIcon } from "./icons";
import { posthog, posthogEnabled } from "../../lib/posthog";
import { FieldInput, FieldShell } from "../shared/FieldInput";

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
  const noteSectionRef = useRef<HTMLDivElement>(null);
  const hasTitle = bookTitle.trim().length > 0;
  const shouldShowNoteField = hasTitle && !isSubmitted;
  const [shouldRenderNoteField, setShouldRenderNoteField] = useState(false);
  const [isNoteFieldVisible, setIsNoteFieldVisible] = useState(false);
  const [noteSectionHeight, setNoteSectionHeight] = useState(0);

  const getNoteSectionHeight = useCallback(() => {
    if (!noteSectionRef.current) return 0;

    return noteSectionRef.current.scrollHeight + 6;
  }, []);

  useEffect(() => {
    if (shouldShowNoteField) {
      setShouldRenderNoteField(true);
      setNoteSectionHeight(0);
      setIsNoteFieldVisible(false);
      return;
    }

    setIsNoteFieldVisible(false);
    setNoteSectionHeight(getNoteSectionHeight());

    const frame = requestAnimationFrame(() => setNoteSectionHeight(0));

    const timeout = setTimeout(() => setShouldRenderNoteField(false), 360);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [getNoteSectionHeight, shouldShowNoteField]);

  useLayoutEffect(() => {
    if (!shouldRenderNoteField || !shouldShowNoteField) return;

    const frame = requestAnimationFrame(() => {
      setNoteSectionHeight(getNoteSectionHeight());
      setIsNoteFieldVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [getNoteSectionHeight, shouldRenderNoteField, shouldShowNoteField]);

  useEffect(() => {
    if (!shouldRenderNoteField || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (isNoteFieldVisible) {
        setNoteSectionHeight(getNoteSectionHeight());
      }
    });

    if (noteSectionRef.current) observer.observe(noteSectionRef.current);

    return () => observer.disconnect();
  }, [getNoteSectionHeight, isNoteFieldVisible, shouldRenderNoteField]);

  useEffect(() => {
    if (shouldRenderNoteField) {
      return;
    }

    setIsNoteFieldVisible(false);
    setNoteSectionHeight(0);
  }, [shouldRenderNoteField]);

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

  const inputFont = { fontVariationSettings: "'wdth' 100" } as const;
  const libraryInputClass =
    "px-3.5 font-['SF_Pro:Regular',sans-serif] font-normal transition-opacity duration-300";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={animateClose} />

      <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-2xl w-[calc(100vw-64px)] sm:w-[420px] max-w-[420px] ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
        <div
          aria-hidden="true"
          className="absolute border border-zinc-50 border-solid inset-0 pointer-events-none rounded-2xl shadow-soft"
        />
        <div className="content-stretch flex flex-col items-start p-5 pt-4.5 pb-5 relative w-full">
          <div
            className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-normal relative shrink-0 text-base gap-0 text-zinc-900 w-full"
            style={inputFont}
          >
            <p className="font-normal">
              Have a book suggestion?
              <br />
              <span className="text-zinc-500 font-normal">Drop it here! I'll check it out :) </span>
            </p>
          </div>

          {/* Book Title Row */}
          <div className="content-stretch flex gap-2.5 items-center relative shrink-0 w-full mt-3">
            <FieldShell
              tone="muted"
              active={isSubmitted}
              className="basis-0 grow min-h-px min-w-px"
            >
              {isSubmitted ? (
                <div
                  className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 px-3.5 text-base text-blue-500 text-nowrap transition-opacity duration-300"
                  style={inputFont}
                >
                  <p>Thank you!</p>
                </div>
              ) : (
                <FieldInput
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Book Title"
                  className={libraryInputClass}
                  style={inputFont}
                  autoFocus
                />
              )}
            </FieldShell>

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
          {shouldRenderNoteField && (
            <div
              className={`w-full overflow-hidden transition-[height,margin,padding] duration-[360ms] ease-out ${
                isNoteFieldVisible
                  ? "mt-3 pt-1.5"
                  : "mt-0 pt-0"
              }`}
              style={{ height: noteSectionHeight }}
            >
              <div
                ref={noteSectionRef}
                className={`flex flex-col transition-[opacity,transform] duration-[260ms] ease-out ${
                  isNoteFieldVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                }`}
              >
                <div className="h-px bg-zinc-100 w-[calc(100%-50px)]" />
                <p
                  className="font-['SF_Pro:Regular',sans-serif] font-normal text-base text-zinc-900 mt-3"
                  style={inputFont}
                >
                  Add your name, email, or a note?
                </p>
                <FieldShell tone="muted" className="mt-3 min-h-10">
                  <FieldInput
                    ref={noteInputRef}
                    type="text"
                    value={senderNote}
                    onChange={(e) => setSenderNote(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Say Hi"
                    className={libraryInputClass}
                    style={inputFont}
                  />
                </FieldShell>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
