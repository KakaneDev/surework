export interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName: string;
  slaDueAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  responses?: TicketResponse[];
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TicketResponse {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface CreateTicketRequest {
  tenantId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  tenantId?: string;
  page: number;
  size: number;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  createdBy: string;
  createdAt: string;
}
