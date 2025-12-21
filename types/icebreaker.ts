// Ice Breaker Type Definitions for Roomatinder

export type IceBreakerType = 'common' | 'lifestyle' | 'curiosity';

export interface IceBreakerSuggestion {
  type: IceBreakerType;
  text: string;
  reason?: string; // Brief explanation of why this opener works
}

export interface IceBreakerResponse {
  suggestions: IceBreakerSuggestion[];
  success: boolean;
  error?: string;
}

export interface IceBreakerRequest {
  meProfile: any;
  partnerProfile: any;
}
