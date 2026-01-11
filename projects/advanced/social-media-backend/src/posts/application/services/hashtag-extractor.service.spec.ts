import { HashtagExtractorService } from './hashtag-extractor.service';

describe('HashtagExtractorService', () => {
  let service: HashtagExtractorService;

  beforeEach(() => {
    service = new HashtagExtractorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extract', () => {
    it('should extract a single hashtag', () => {
      const result = service.extract('Hello #world');
      expect(result).toEqual(['world']);
    });

    it('should extract multiple hashtags', () => {
      const result = service.extract('Hello #world #coding #nestjs');
      expect(result).toEqual(['world', 'coding', 'nestjs']);
    });

    it('should extract hashtags at the beginning of content', () => {
      const result = service.extract('#hello world');
      expect(result).toEqual(['hello']);
    });

    it('should extract hashtags at the end of content', () => {
      const result = service.extract('Hello world #coding');
      expect(result).toEqual(['coding']);
    });

    it('should return empty array for content without hashtags', () => {
      const result = service.extract('Hello world without hashtags');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      const result = service.extract('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null content', () => {
      const result = service.extract(null as unknown as string);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined content', () => {
      const result = service.extract(undefined as unknown as string);
      expect(result).toEqual([]);
    });

    it('should convert hashtags to lowercase', () => {
      const result = service.extract('Hello #WORLD #CoDiNg');
      expect(result).toEqual(['world', 'coding']);
    });

    it('should remove duplicate hashtags', () => {
      const result = service.extract('#hello #world #hello #coding #world');
      expect(result).toEqual(['hello', 'world', 'coding']);
    });

    it('should handle hashtags with numbers', () => {
      const result = service.extract('#es2024 #web3 #v2');
      expect(result).toEqual(['es2024', 'web3', 'v2']);
    });

    it('should handle hashtags with underscores', () => {
      const result = service.extract('#hello_world #my_tag');
      expect(result).toEqual(['hello_world', 'my_tag']);
    });

    it('should not include special characters in hashtags', () => {
      const result = service.extract('#hello! #world? #coding.');
      expect(result).toEqual(['hello', 'world', 'coding']);
    });

    it('should handle hashtags surrounded by text', () => {
      const result = service.extract('Check out #nestjs framework today');
      expect(result).toEqual(['nestjs']);
    });

    it('should handle consecutive hashtags', () => {
      const result = service.extract('#one#two#three');
      expect(result).toEqual(['one', 'two', 'three']);
    });

    it('should handle hashtag followed by punctuation', () => {
      const result = service.extract('Love #coding, #programming, and #typescript!');
      expect(result).toEqual(['coding', 'programming', 'typescript']);
    });

    it('should filter out empty hashtags (just #)', () => {
      const result = service.extract('Hello # world #coding');
      expect(result).toEqual(['coding']);
    });

    it('should filter out very long hashtags (>50 chars)', () => {
      const longTag =
        'a'.repeat(51);
      const result = service.extract(`#short #${longTag} #valid`);
      expect(result).toEqual(['short', 'valid']);
    });

    it('should keep hashtags with exactly 50 characters', () => {
      const exactTag = 'a'.repeat(50);
      const result = service.extract(`#${exactTag}`);
      expect(result).toEqual([exactTag]);
    });

    it('should handle multiline content', () => {
      const content = `First line #tag1
      Second line #tag2
      Third line #tag3`;
      const result = service.extract(content);
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle real-world social media post', () => {
      const content =
        'Just finished my new #NestJS project! Using #TypeScript and #CQRS pattern. #WebDev #Backend #100DaysOfCode';
      const result = service.extract(content);
      expect(result).toEqual([
        'nestjs',
        'typescript',
        'cqrs',
        'webdev',
        'backend',
        '100daysofcode',
      ]);
    });
  });
});
