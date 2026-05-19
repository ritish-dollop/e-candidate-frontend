import { Component } from '@angular/core';
import { EmailContentComponent } from "./email-content/EmailContentComponent";
import { RouterOutlet } from "@angular/router";
import { EmailListComponent } from "./email-list/email-list.component";

@Component({
  selector: 'app-email-functionality',
  templateUrl: './email-functionality.component.html',
  styleUrls: ['./email-functionality.component.css'],
  imports: [RouterOutlet, EmailListComponent]
})
export class EmailFunctionalityComponent {
}
