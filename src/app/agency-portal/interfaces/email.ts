export interface MailDTO {
  id: number;
  subject: string;
  body: string;
  sentAt: string;
  sender: {
    id: number;
    fullName: string;
    email: string;
  };
  // attachments omitted for brevity
}

export interface UserMailDTO {
  id: number;
  userId: number;
  mail: MailDTO;

  isRead: boolean;
  starred: boolean;
  deleted: boolean;

  folder: Folder;
  recipientType: 'TO' | 'CC' | 'BCC' | 'FROM';
}




export interface MailResponseDTO {
  mailId: number;
  fromName : string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];

  subject: string;
  body: string;
  avatar : string;
  sentAt: string; // Instant comes as ISO string in JSON

  read: boolean;
  starred: boolean;
  deleted: boolean;
    /* 🔁 Reply / Forward */
  actionType: MailActionType;
  parentMailId?: number;

  folder: Folder;
  attachments: AttachmentDTO[];
}

export interface AttachmentDTO {
  filename: string;
  contentType: string;
  url: string;
  size : number;
}

export type Folder =
  | 'INBOX'
  | 'SENT'
  | 'TRASH'


  export type MailActionType =
  | 'NEW'
  | 'REPLY'
  | 'REPLY_ALL'
  | 'FORWARD';
