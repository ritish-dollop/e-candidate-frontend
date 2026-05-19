export interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: string;
  readStatus: boolean;
  status: 'UNREAD' | 'READ' | 'DELETED';

  recipientId: number;
  recipientName: string;
  recipientEmail: string;

  timestamp: string; 
  updatedAt: string; 
  entityType?: 'TASK' | 'EVENT';
  entityId?: number;
}
