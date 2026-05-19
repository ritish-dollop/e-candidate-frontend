import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-text-field',
  imports:[CommonModule],
  templateUrl: './input-text-field.component.html',
  styleUrls: ['./input-text-field.component.css']
})
export class InputTextFieldComponent {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() className: string = '';
  @Input() additionalClass: string = ''; // New property for additional classes
  @Input() additionalInputClass: string = ''; // New property for additional input classes
}
