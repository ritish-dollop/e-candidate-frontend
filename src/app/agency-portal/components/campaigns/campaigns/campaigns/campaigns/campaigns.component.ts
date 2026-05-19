import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListCampaignsComponent } from './list-campaigns/list-campaigns.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-campaigns',
  imports: [FormsModule,RouterOutlet],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.css'
})
export class CampaignsComponent {

}
