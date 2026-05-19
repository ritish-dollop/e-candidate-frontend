import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CustomerCardComponent } from './customer-card/customer-card.component';

@Component({
  selector: 'app-customers',
  imports: [CommonModule,RouterOutlet,RouterModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent {

}
