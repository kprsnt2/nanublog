import fs from 'fs';
import path from 'path';

export interface GalleryImage {
  src: string;
  filename: string;
  date: Date | null;
  dateFormatted: string;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'];

/**
 * Extracts date from filenames like:
 * - IMG_20190614_220013_1.jpg   -> June 14, 2019
 * - IMG-20190525-WA0003.jpg     -> May 25, 2019
 * - IMG20190721093801.jpg       -> July 21, 2019
 * - VID_20190406_204908.gif     -> April 6, 2019
 * - PAINTING_20200301_xyz.jpg   -> March 1, 2020
 * 
 * Looks for YYYYMMDD pattern after any separator (_, -, or nothing).
 */
function extractDateFromFilename(filename: string): Date | null {
  // Match YYYYMMDD after underscore, dash, or directly after letters (e.g. IMG20190721)
  const match = filename.match(/(?:^|[_\-]|[A-Za-z])(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:[_\-.]|\d)/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // JS months are 0-indexed
    const day = parseInt(match[3]);
    const date = new Date(year, month, day);
    // Sanity check - only accept dates between 2015 and 2030
    if (year >= 2015 && year <= 2030) {
      return date;
    }
  }
  return null;
}

/**
 * Scans a directory inside public/ for image files.
 * Extracts dates from filenames and returns sorted (newest first).
 */
export function scanImagesFromFolder(folderName: string): GalleryImage[] {
  const publicDir = path.join(process.cwd(), 'public', folderName);
  
  if (!fs.existsSync(publicDir)) {
    return [];
  }

  const files = fs.readdirSync(publicDir);
  
  const images: GalleryImage[] = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext) && !file.startsWith('.');
    })
    .map((file) => {
      const date = extractDateFromFilename(file);
      return {
        src: `/${folderName}/${file}`,
        filename: file,
        date,
        dateFormatted: date
          ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '',
      };
    });

  // Sort by date (newest first), files without dates go to the end
  images.sort((a, b) => {
    if (a.date && b.date) return b.date.getTime() - a.date.getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return a.filename.localeCompare(b.filename);
  });

  return images;
}

/**
 * Groups images by year-month for a timeline-style display
 */
export function groupImagesByMonth(images: GalleryImage[]): Map<string, GalleryImage[]> {
  const groups = new Map<string, GalleryImage[]>();
  
  images.forEach((img) => {
    const key = img.date
      ? img.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : 'Undated';
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(img);
  });

  return groups;
}
