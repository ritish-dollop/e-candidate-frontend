import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StyleLoaderService {
  private renderer: Renderer2;
  private loadedStylesheets: { [key: string]: HTMLLinkElement } = {};

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadStylesheets(stylePaths: string[]): void {
    this.removeAllStylesheets(); // Remove all previous stylesheets before loading new ones

    stylePaths.forEach(path => {
      if (!this.loadedStylesheets[path]) {
        const link = this.renderer.createElement('link');
        this.renderer.setAttribute(link, 'rel', 'stylesheet');
        this.renderer.setAttribute(link, 'type', 'text/css');
        this.renderer.setAttribute(link, 'href', path);
        this.renderer.appendChild(document.head, link);
        this.loadedStylesheets[path] = link;
      }
    });
  }

  removeStylesheets(stylePaths: string[]): void {
    stylePaths.forEach(path => {
      const link = this.loadedStylesheets[path];
      if (link) {
        this.renderer.removeChild(document.head, link);
        delete this.loadedStylesheets[path];
      }
    });
  }

  // Helper to remove all currently loaded stylesheets
  removeAllStylesheets(): void {
    Object.values(this.loadedStylesheets).forEach(link => {
      this.renderer.removeChild(document.head, link);
    });
    this.loadedStylesheets = {};
  }
}
