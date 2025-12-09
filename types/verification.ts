import { UserProfile as BaseUserProfile } from './profile';

export interface UserProfile extends BaseUserProfile {
  verification?: {
    inquiryId?: string;
    status?: 'pending' | 'completed' | 'approved' | 'declined' | 'failed';
    isVerified?: boolean;
    completedAt?: string;
    approvedAt?: string;
    declinedAt?: string;
    failedAt?: string;
  };
}
