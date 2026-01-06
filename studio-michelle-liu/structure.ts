import {StructureBuilder} from 'sanity/structure'
import {BookIcon, DocumentsIcon} from '@sanity/icons'

// Years to show in the shelf structure
const SHELF_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020']

// Helper to create year-filtered list for a media type
const createYearList = (S: StructureBuilder, mediaType: string, year: string) =>
  S.listItem()
    .title(year)
    .id(`${mediaType}-${year}`)
    .child(
      S.documentList()
        .title(`${mediaType === 'book' ? '📚' : mediaType === 'music' ? '🎵' : '🎬'} ${year}`)
        .filter('_type == "shelfItem" && mediaType == $mediaType && year == $year')
        .params({mediaType, year})
        .defaultOrdering([{field: 'title', direction: 'asc'}])
    )

// Helper to create a media type section with year filters
const createMediaTypeSection = (
  S: StructureBuilder,
  title: string,
  mediaType: string,
  emoji: string
) =>
  S.listItem()
    .title(`${emoji} ${title}`)
    .id(`shelf-${mediaType}`)
    .child(
      S.list()
        .title(`${emoji} ${title}`)
        .items([
          // Year sections
          ...SHELF_YEARS.map((year) => createYearList(S, mediaType, year)),
          // Divider
          S.divider(),
          // All items
          S.listItem()
            .title(`All ${title}`)
            .id(`${mediaType}-all`)
            .child(
              S.documentList()
                .title(`All ${title}`)
                .filter('_type == "shelfItem" && mediaType == $mediaType')
                .params({mediaType})
                .defaultOrdering([{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}])
            ),
        ])
    )

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Project
      S.listItem()
        .title('Project')
        .schemaType('project')
        .child(S.documentTypeList('project').title('Projects')),

      // Art Piece
      S.listItem()
        .title('Art Piece')
        .schemaType('artPiece')
        .child(S.documentTypeList('artPiece').title('Art Pieces')),

      // Sketchbook
      S.listItem()
        .title('Sketchbook')
        .schemaType('sketchbook')
        .child(S.documentTypeList('sketchbook').title('Sketchbooks')),

      // Mural
      S.listItem()
        .title('Mural')
        .schemaType('mural')
        .child(S.documentTypeList('mural').title('Murals')),

      // Book
      S.listItem()
        .title('Book')
        .schemaType('book')
        .child(S.documentTypeList('book').title('Books')),

      // About Page
      S.listItem()
        .title('About Page')
        .schemaType('aboutPage')
        .child(S.documentTypeList('aboutPage').title('About Pages')),

      // Experience
      S.listItem()
        .title('Experience')
        .schemaType('experience')
        .child(S.documentTypeList('experience').title('Experiences')),

      // Community
      S.listItem()
        .title('Community')
        .schemaType('community')
        .child(S.documentTypeList('community').title('Communities')),

      S.divider(),

      // ===== SHELF SECTION =====
      S.listItem()
        .title('📚 Books')
        .icon(BookIcon)
        .id('shelf-books')
        .child(
          S.list()
            .title('📚 Books')
            .items([
              S.listItem()
                .title('★ Favorites')
                .id('book-favorites')
                .child(
                  S.documentList()
                    .title('★ Favorite Books')
                    .filter('_type == "shelfItem" && mediaType == "book" && isFeatured == true')
                    .defaultOrdering([{field: 'title', direction: 'asc'}])
                ),
              S.divider(),
              ...SHELF_YEARS.map((year) => createYearList(S, 'book', year)),
              S.divider(),
              S.listItem()
                .title('All Books')
                .id('book-all')
                .child(
                  S.documentList()
                    .title('All Books')
                    .filter('_type == "shelfItem" && mediaType == "book"')
                    .defaultOrdering([{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}])
                ),
            ])
        ),

      S.listItem()
        .title('🎵 Music')
        .id('shelf-music')
        .child(
          S.list()
            .title('🎵 Music')
            .items([
              S.listItem()
                .title('★ Favorites')
                .id('music-favorites')
                .child(
                  S.documentList()
                    .title('★ Favorite Music')
                    .filter('_type == "shelfItem" && mediaType == "music" && isFeatured == true')
                    .defaultOrdering([{field: 'title', direction: 'asc'}])
                ),
              S.divider(),
              ...SHELF_YEARS.map((year) => createYearList(S, 'music', year)),
              S.divider(),
              S.listItem()
                .title('All Music')
                .id('music-all')
                .child(
                  S.documentList()
                    .title('All Music')
                    .filter('_type == "shelfItem" && mediaType == "music"')
                    .defaultOrdering([{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}])
                ),
            ])
        ),

      S.listItem()
        .title('🎬 Movies')
        .id('shelf-movies')
        .child(
          S.list()
            .title('🎬 Movies')
            .items([
              S.listItem()
                .title('★ Favorites')
                .id('movie-favorites')
                .child(
                  S.documentList()
                    .title('★ Favorite Movies')
                    .filter('_type == "shelfItem" && mediaType == "movie" && isFeatured == true')
                    .defaultOrdering([{field: 'title', direction: 'asc'}])
                ),
              S.divider(),
              ...SHELF_YEARS.map((year) => createYearList(S, 'movie', year)),
              S.divider(),
              S.listItem()
                .title('All Movies')
                .id('movie-all')
                .child(
                  S.documentList()
                    .title('All Movies')
                    .filter('_type == "shelfItem" && mediaType == "movie"')
                    .defaultOrdering([{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}])
                ),
            ])
        ),

      S.divider(),

      // Lore Item
      S.listItem()
        .title('Lore Item')
        .schemaType('loreItem')
        .child(S.documentTypeList('loreItem').title('Lore Items')),

      // Quote
      S.listItem()
        .title('Quote')
        .schemaType('aboutQuote')
        .child(S.documentTypeList('aboutQuote').title('Quotes')),
    ])
