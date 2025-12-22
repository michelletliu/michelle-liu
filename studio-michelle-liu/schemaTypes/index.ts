// Document types
import {project} from './project'

// Object types (used in documents)
import {metadataItem} from './objects/metadataItem'
import {missionSection} from './objects/missionSection'
import {protectedSection} from './objects/protectedSection'
import {gallerySection} from './objects/gallerySection'
import {textSection} from './objects/textSection'
import {imageSection} from './objects/imageSection'
import {videoSection} from './objects/videoSection'
import {testimonialSection} from './objects/testimonialSection'

export const schemaTypes = [
  // Documents
  project,
  
  // Objects (must be registered for use in arrays)
  metadataItem,
  missionSection,
  protectedSection,
  gallerySection,
  textSection,
  imageSection,
  videoSection,
  testimonialSection,
]
