/**
 * Converts a string to a URL-friendly slug.
 *
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated string suitable for URLs
 *
 * @example
 * generateSlug('Hello World!') // Returns 'hello-world'
 * generateSlug('My First Blog Post') // Returns 'my-first-blog-post'
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Generates a unique slug by appending a suffix if needed.
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 *
 * @example
 * makeSlugUnique('hello-world', ['hello-world']) // Returns 'hello-world-1'
 * makeSlugUnique('hello-world', ['hello-world', 'hello-world-1']) // Returns 'hello-world-2'
 */
export function makeSlugUnique(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
