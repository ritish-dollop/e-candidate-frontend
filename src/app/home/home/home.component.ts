import { Component, signal } from '@angular/core';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [SidebarComponent, NavbarComponent, RouterModule,CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  showSidebar = signal(true); isCustomerAddPage = signal(false);

  constructor(private router: Router) {
    this.router.events
  .pipe(filter((event) => event instanceof NavigationEnd))
  .subscribe((event: any) => {

    const url = event.urlAfterRedirects || event.url;
    console.log("CURRENT ROUTE = ", url);   // ⭐ IMPORTANT
    const hideSidebar =
      url.includes('/add') ||
      url.includes('/customer/add') ||  
      url.includes('/agency/customer/add') ||
      url.includes('/agency/campaigns/') ||
      /\/\w+\/\d+\/users$/.test(url); // branch users condition

    this.showSidebar.set(!hideSidebar);

      this.isCustomerAddPage.set(
          url.includes('/agency/customer/add')
        );
  });

  }
}