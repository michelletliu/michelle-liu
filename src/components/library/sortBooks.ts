import type { Book } from "./types";

export function booksForShelf(books: Book[], shelf: string): Book[] {
  if (shelf === "all") return books;
  if (shelf === "favorites") return books.filter((book) => book.isFavorite);

  return books
    .filter((book) => book.year === shelf)
    .map((book, index) => ({ book, index }))
    .sort((a, b) => {
      if (!a.book.dateRead && !b.book.dateRead) return a.index - b.index;
      if (!a.book.dateRead) return 1;
      if (!b.book.dateRead) return -1;

      return (
        b.book.dateRead.localeCompare(a.book.dateRead) ||
        a.index - b.index
      );
    })
    .map(({ book }) => book);
}
