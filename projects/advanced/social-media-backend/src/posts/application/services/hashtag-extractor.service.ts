import { Injectable } from '@nestjs/common';

@Injectable()
export class HashtagExtractorService {
  private readonly HASHTAG_REGEX = /#(\w+)/g;

  extract(content: string): string[] {
    if (!content) return [];

    const matches = content.match(this.HASHTAG_REGEX);
    if (!matches) return [];

    // Remove # prefix, lowercase, and deduplicate
    return matches
      .map((tag) => tag.slice(1).toLowerCase())
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .filter((tag) => tag.length > 0 && tag.length <= 50);
  }
}
