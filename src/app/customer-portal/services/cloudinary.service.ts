import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private cloudName = 'dmfqyu54w';
  private uploadPreset = 'angular';

  constructor(private http: HttpClient) {}

  private getResourceType(file: File): 'image' | 'video' | 'raw' {
    const mime = file.type;

    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';

    // PDF, DOC, XLS, ZIP, etc → raw
    if (
      mime === 'application/pdf' ||
      mime.includes('msword') ||
      mime.includes('officedocument') ||
      mime.includes('spreadsheet') ||
      mime.includes('presentation') ||
      mime.includes('zip') ||
      mime.includes('json')
    ) {
      return 'raw';
    }

    return 'raw';
  }

  async uploadFile(file: File): Promise<string> {
    const resourceType = this.getResourceType(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    const res: any = await firstValueFrom(this.http.post(url, formData));
    return res.secure_url as string;
  }
}
