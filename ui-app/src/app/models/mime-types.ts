export enum MimeType {
  CSV = 'text/csv',
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PDF = 'application/pdf',
  PNG = 'image/png',
  TEXT = 'text/plain'
}

export const DEFAULT_MIME_TYPES = Object.values(MimeType).sort();
export const IMAGE_MIME_TYPES = [MimeType.PNG, MimeType.JPG, MimeType.JPEG];
