import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gmailTime'
})
export class GmailTimePipe implements PipeTransform {

  transform(value: string | Date): string {
    const date = new Date(value);
    const now = new Date();

    const isToday =
      date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.toDateString() === yesterday.toDateString();

    // same week check
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    const isSameWeek = diffInDays < 7 && date.getDay() <= now.getDay();

    // Gmail Formatting Rules
    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    if (isYesterday) {
      return 'Yesterday';
    }

    if (isSameWeek) {
      return date.toLocaleDateString([], { weekday: 'short' }); // Mon, Tue etc.
    }

    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      }); // Dec 10
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }); // Dec 10, 2024
  }
}
