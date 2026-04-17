import { marked } from 'marked';

export class MarkdownService {
  private renderer: marked.Renderer;

  constructor() {
    this.renderer = new marked.Renderer();
    
    // Customize link rendering if needed
    // this.renderer.link = (href, title, text) => { ... }
  }

  /**
   * Renders markdown to HTML, including WikiLink support.
   */
  render(markdown: string): string {
    if (!markdown) return '';
    
    // Pre-process WikiLinks: [[Title|Alias]] or [[Title]]
    // Matches [[Anything except | or ]] optionally | Anything except ]] ]]
    const processed = markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, title, alias) => {
      const linkText = alias || title;
      const target = encodeURIComponent(title.trim());
      // We navigate to registry with a query param for now, 
      // where our logic will handle opening the document.
      return `<a href="/registry?search=${target}" class="wikilink" data-title="${title.trim()}">${linkText}</a>`;
    });

    return marked.parse(processed, { renderer: this.renderer }) as string;
  }
}

export const markdownService = new MarkdownService();
