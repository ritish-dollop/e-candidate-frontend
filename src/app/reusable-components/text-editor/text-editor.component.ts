import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttachmentDTO } from '../../agency-portal/interfaces/email';
import { CloudinaryService } from '../../agency-portal/services/chat-service/cloudnary.service';

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css']
})
export class TextEditorComponent implements AfterViewInit {
  // bind from parent: [(ngModel)]-like API
  @Input() value = '';              // editor text coming from parent
  @Output() valueChange = new EventEmitter<string>();

  @Input() attachmentUrls: AttachmentDTO[] = [];
  @Output() attachmentUrlsChange = new EventEmitter<AttachmentDTO[]>();

  @ViewChild('editor', { static: false }) editor!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInputAttachment', { static: false }) fileInputAttachment!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputImage', { static: false }) fileInputImage!: ElementRef<HTMLInputElement>;

  showEmojiPicker = false;
  emojis: string[] = ['😀','😁','😂','🤣','😃','😄','😍','🥰','😢','😭','👍','❤️','🔥','⭐'];

  ngAfterViewInit(): void {
    // initialize editor DOM with current value from parent
    if (this.editor?.nativeElement) {
      this.editor.nativeElement.innerHTML = this.value || '';
    }
  }
constructor(private cloud : CloudinaryService){}
  // sync DOM -> value
  onEditorInput(event: Event): void {
    const target = event.target as HTMLElement;
    this.value = target.innerHTML || '';
    this.valueChange.emit(this.value);
  }

  private syncBody(): void {
    if (this.editor?.nativeElement) {
      this.value = this.editor.nativeElement.innerHTML || '';
      this.valueChange.emit(this.value);
    }
  }

  private focusEditor(): void {
    this.editor?.nativeElement.focus();
  }

  // formatting
  format(cmd: string): void {
    this.focusEditor();
    document.execCommand(cmd, false, undefined);
    this.syncBody();
  }

  insertList(type: 'ul' | 'ol'): void {
    this.focusEditor();
    document.execCommand(
      type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList',
      false,
      undefined
    );
    this.syncBody();
  }

  insertQuote(): void {
    this.focusEditor();
    document.execCommand('formatBlock', false, 'blockquote');
    this.syncBody();
  }

  removeFormatting(): void {
    this.focusEditor();
    document.execCommand('removeFormat', false, undefined);
    this.syncBody();
  }

  addLink(): void {
    this.focusEditor();
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      this.syncBody();
    }
  }

  insertCode(): void {
    this.focusEditor();
    document.execCommand('insertHTML', false, '<code>Code</code>');
    this.syncBody();
  }

  // Emoji
  openEmoji(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.focusEditor();
    document.execCommand('insertText', false, emoji);
    this.syncBody();
    this.showEmojiPicker = false;
  }

  // File uploads – these still push into attachmentUrls and emit
  uploadAttachment(): void {
    this.fileInputAttachment?.nativeElement.click();
  }


  uploadImage(): void {
    this.fileInputImage?.nativeElement.click();
  }



  async onAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    // TODO: replace with your real upload service
  // const url = await this.cloud.uploadFile(file);
  //   this.attachmentUrls = [
  //     ...this.attachmentUrls,
  //     { filename: file.name, contentType: file.type, url : , size: file.size }
  //   ];
    try {
      const url = await this.cloud.uploadFile(file);
      this.attachmentUrls.push({
        filename: file.name,
        contentType: file.type,
        url: url,
        size: file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    this.attachmentUrlsChange.emit(this.attachmentUrls);
    input.value = '';
  }
  // async onAttachmentSelected(event: Event): Promise<void> {
  //   const input = event.target as HTMLInputElement;
  //   if (!input.files?.length) return;

  //   const file = input.files[0];
  //   try {
  //     const url = await this.cloud.uploadFile(file);
  //     this.attachmentUrls.push({
  //       filename: file.name,
  //       contentType: file.type,
  //       url: url,
  //       size: file.size
  //     });
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //   }
  //   input.value = '';
  // }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      const url = await this.cloud.uploadFile(file);
      this.attachmentUrls.push({
            filename: file.name,
        contentType: file.type,
        url: url,
        size: file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    input.value = '';
  }


  // async onImageSelected(event: Event): Promise<void> {
  //   const input = event.target as HTMLInputElement;
  //   if (!input.files?.length) return;

  //   const file = input.files[0];
  //   // TODO: replace with your real upload service
  //   const url = 'UPLOADED_IMAGE_URL';
  //   this.attachmentUrls = [
  //     ...this.attachmentUrls,
  //     { filename: file.name, contentType: file.type, url, size: file.size }
  //   ];
  //   this.attachmentUrlsChange.emit(this.attachmentUrls);
  //   input.value = '';
  // }
}
