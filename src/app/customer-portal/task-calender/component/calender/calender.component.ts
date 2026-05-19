import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';


@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [FullCalendarModule, CommonModule],
  templateUrl: './calender.component.html',
  styleUrls: ['./calender.component.css']
})
export class CalenderComponent implements AfterViewInit {
  @ViewChild('fullCal') fullCal!: FullCalendarComponent;

  // Access FullCalendar instance
  @ViewChild(FullCalendarComponent) fullCalendar!: FullCalendarComponent;
  public calendarApi: any;

  // @Output() taskClicked = new EventEmitter<number>();
  @Output() calendarItemClick = new EventEmitter<{ id: number, type: string }>();

  @Input() openAddEventForm: boolean = false;
  @Input() defaultModalTab: 'task' | 'event' | '' = '';
  @Input() isAgencyView = false;
  activeInnerTab: 'task' | 'event' | '' = 'task';
  modalActiveTab: 'task' | 'event' = 'task';
  activeTab: number = 1;

  openAddMeetingMode: boolean = false;

  constructor() {
    window.addEventListener('calendar-click', (e: any) => {
      this.calendarItemClick.emit(e.detail);
    });
  }

  onViewChange(_view: string) {
    // Placeholder for parent compatibility; FullCalendar handles the rendering.
  }
  ngAfterViewInit() {
    // initialize FullCalendar API
    this.calendarApi = this.fullCalendar.getApi();
    setTimeout(() => {
      if (!this.calendarApi) return;

      const api = this.calendarApi;
      const viewType = api.view?.type || this.calendarOptions.initialView || 'dayGridMonth';

      api.changeView(viewType); // same as user changing view once
      api.updateSize();         // recalc width/height based on visible container
      api.render();             // final paint
    }, 300);
  }

  // Parent component will call this
  gotoDate(date: Date) {
    if (this.calendarApi) {
      this.calendarApi.gotoDate(date);

      // Important: re-render after jumping
      setTimeout(() => {
        this.calendarApi.render();
      }, 0);
    }
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false,
    events: [], // dynamically filled
    allDaySlot: false,

    views: {
      timeGridDay: {
        slotDuration: '01:00:00',
        slotLabelFormat: {
          hour: 'numeric',
          hour12: true
        },
        dayHeaderFormat: {
          weekday: 'long'
        }
      }
    },

    eventContent: (arg) => {
      let title = arg.event.title;
      let id = arg.event.id;
      let type = arg.event.extendedProps['type'];

      let bgClass = 'action_card_background'; // default task
      if (type === 'event') {
        bgClass = 'primary_card_background';
      } else if (type === 'assigned-task') {
        bgClass = 'assigned-task-bg'; // red
      } else if (type === 'assigned-event') {
        bgClass = 'assigned-event-bg'; // yellow
      }

      const clickType = type.includes('task') ? 'task' : 'event';

      return {
        html: `<div 
            class="${bgClass} px-2 py-1 Caption Medium calendar-item-ui"
            onclick="window.dispatchEvent(new CustomEvent('calendar-click', 
              { detail: { id: ${id}, type: '${clickType}' } }))"
          >
            ${title}
          </div> `
      };
    }
  };

  // Update calendar with new events
  reloadCalendarEvents(newEvents: any[] = []) {
    // Immutable update is important
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...newEvents]  // <-- immutable copy
    };

    // Force FullCalendar to re-render UI
    setTimeout(() => {
      if (this.fullCalendar) {
        this.fullCalendar.getApi().refetchEvents();
        this.fullCalendar.getApi().render();
      }
    }, 0);
  }


  removeEvent(eventId: number) {
    const events = this.calendarOptions.events as any[];
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events.filter(e => e.id !== eventId)
    };
  }

  changeView(view: string) {
    if (this.fullCal && this.fullCal.getApi()) {
      const api = this.fullCal.getApi();
      api.changeView(view);

      setTimeout(() => api.render(), 0);
    }
  }
}