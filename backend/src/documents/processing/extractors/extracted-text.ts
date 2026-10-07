/** Text pulled out of a file, split by page where the format has pages. */
export interface ExtractedPage {
  pageNumber: number | null;
  text: string;
}

export interface TextExtractor {
  extract(buffer: Buffer): Promise<ExtractedPage[]>;
}
