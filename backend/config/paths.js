import path from 'path';

// Where uploaded photos (and the AI service's annotated copies) are written.
// Served read-only under /uploads. Tests point this at a temporary directory.
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || 'uploads');
