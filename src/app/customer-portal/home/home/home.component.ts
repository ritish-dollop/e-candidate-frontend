import { Component, signal } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    SidebarComponent,
    NavbarComponent,
    RouterModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  showSidebar = signal(true);

  constructor(private router: Router) {
    this.router.events
  .pipe(filter((event) => event instanceof NavigationEnd))
  .subscribe((event: any) => {

    const url = event.urlAfterRedirects || event.url;

    const hideSidebar =
      url.includes('/campaign/details') ||
      url.includes('/campaign/single-lead-detail') ||
      /\/\w+\/\d+\/users$/.test(url); // branch users condition

    this.showSidebar.set(!hideSidebar);
  });

  }
}
