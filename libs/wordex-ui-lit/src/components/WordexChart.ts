import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('wordex-chart')
export class WordexChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 200px;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    polyline {
      fill: none;
      stroke: #06b6d4;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
    }
    .area {
      fill: url(#gradient);
      opacity: 0.3;
    }
    circle {
      fill: #7c3aed;
      stroke: white;
      stroke-width: 2;
    }
  `;

  @property({ type: Array }) data: number[] = [10, 40, 25, 70, 45, 90, 60];

  render() {
    const width = 400;
    const height = 200;
    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    const range = max - min;
    
    const points = this.data.map((val, i) => {
      const x = (i / (this.data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return html`
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
        </defs>
        <polyline class="area" points="${areaPoints}"></polyline>
        <polyline points="${points}"></polyline>
        ${this.data.map((val, i) => {
          const x = (i / (this.data.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          return svg`<circle cx="${x}" cy="${y}" r="4"></circle>`;
        })}
      </svg>
    `;
  }
}
