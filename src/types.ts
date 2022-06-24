export interface Signature {
  timestamp: string;
  token: string;
  signature: string;
}

export interface EventData {
  event: string,
  timestamp: string;
  id: string;
}

export interface EventContent {
  Provider: string,
  timestamp: string;
  type: string;
}

