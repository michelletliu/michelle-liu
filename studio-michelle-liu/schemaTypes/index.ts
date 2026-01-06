// Document types
import {project} from './project'
import {artPiece} from './artPiece'
import {sketchbook} from './sketchbook'
import {mural} from './mural'
import {book} from './book'

// About page document types
import {aboutPage} from './aboutPage'
import {experience} from './experience'
import {community} from './community'
import {shelfItem} from './shelfItem'
import {loreItem} from './loreItem'
import {aboutQuote} from './aboutQuote'

// Object types (used in documents)
import {metadataItem} from './objects/metadataItem'
import {missionSection} from './objects/missionSection'
import {protectedSection} from './objects/protectedSection'
import {gallerySection} from './objects/gallerySection'
import {textSection} from './objects/textSection'
import {imageSection} from './objects/imageSection'
import {videoSection} from './objects/videoSection'
import {testimonialSection} from './objects/testimonialSection'
import {projectCardSection} from './objects/projectCardSection'
import {sideQuestSection} from './objects/sideQuestSection'
import {dividerSection} from './objects/dividerSection'

export const schemaTypes = [
  // Documents
  project,
  artPiece,
  sketchbook,
  mural,
  book,
  
  // About page
  aboutPage,
  experience,
  community,
  shelfItem,
  loreItem,
  aboutQuote,
  
  // Objects (must be registered for use in arrays)
  metadataItem,
  missionSection,
  protectedSection,
  gallerySection,
  textSection,
  imageSection,
  videoSection,
  testimonialSection,
  projectCardSection,
  sideQuestSection,
  dividerSection,
]
