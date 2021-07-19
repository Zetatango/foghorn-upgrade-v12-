import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomLineChartService {
  /**
   * custom: override SVG to have the dots display all the time over the liner chart
   * since it's not supported anymore from ngx chart
   */

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  showDots(chart): void {

    if (!chart) return;

    let index = 0;
    const paths = chart.chartElement.nativeElement.getElementsByClassName(
      'line-series'
    );
    const color = chart.chartElement.nativeElement.getElementsByClassName(
      'line-highlight'
    );

    for (const path of paths) {
      const chartColor = color[index].getAttribute('ng-reflect-fill');
      const pathElement = path.getElementsByTagName('path')[0];

      const pathAttributes = {
        'marker-start': `url(#dot${index})`,
        'marker-mid': `url(#dot${index})`,
        'marker-end': `url(#dot${index})`
      };

      this.createMarker(chart, chartColor, index);
      this.setAttributes(pathElement, pathAttributes);
      index += 1;
    }
  }

  /**
   * create marker
   */

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  createMarker(chart, color: string, index: number): void {
    const svg = chart.chartElement.nativeElement.getElementsByTagName('svg');
    const marker = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'marker'
    );
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    svg[0].getElementsByTagName('defs')[0].append(marker);
    marker.append(circle);
    const m = svg[0].getElementsByTagName('marker')[index];
    const c = svg[0].getElementsByTagName('circle')[index];

    const markerAttributes = {
      id: `dot${index}`,
      viewBox: '0 0 10 10',
      refX: 5,
      refY: 5,
      markerWidth: 5,
      markerHeight: 5
    };

    const circleAttributes = {
      cx: 5,
      cy: 5,
      r: 5,
      fill: color
    };
    m.append(circle);

    this.setAttributes(m, markerAttributes);
    this.setAttributes(c, circleAttributes);
  }

  /**
   * set multiple attributes
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setAttributes(element, attributes): void {
    for (const key in attributes) {
      element.setAttribute(key, attributes[key]);
    }
  }
}
