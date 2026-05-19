import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  // [RouterModule,RouterLink,CommonModule
  imports:[RouterLink,CommonModule,FormsModule,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  // componenetRoutes = ComponentsRoutes;

  currentRoute: string = '';

  constructor(private router: Router) {
    this.currentRoute = '';
  }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }

isActiveRoute(route: string): boolean {
  return this.currentRoute.startsWith(route);
}


  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  hideSidebar() {
    this.isSidebarOpen = false;
  }
}
