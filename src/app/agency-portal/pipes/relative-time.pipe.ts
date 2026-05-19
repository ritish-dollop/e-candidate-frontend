import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime'
})
export class RelativeTimePipe implements PipeTransform {

  transform(value: string | Date): string {
    const date = new Date(value);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return diffMin + ' min ago';
    if (diffHr < 24) return diffHr + ' hour' + (diffHr > 1 ? 's' : '') + ' ago';
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 30) return diffDay + ' days ago';
    if (diffMonth < 12) return diffMonth + ' month' + (diffMonth > 1 ? 's' : '') + ' ago';

    return diffYear + ' year' + (diffYear > 1 ? 's' : '') + ' ago';
  }
}
