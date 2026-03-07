import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { TenantService } from './tenant.service';
import { TicketService } from './ticket.service';
import { Tenant } from '../models/tenant.model';
import { Ticket } from '../models/ticket.model';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'tenant' | 'ticket';
  link: string;
}

export interface SearchResultGroup {
  type: string;
  icon: string;
  items: SearchResultItem[];
}

export interface SearchResults {
  groups: SearchResultGroup[];
  totalCount: number;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private tenantService = inject(TenantService);
  private ticketService = inject(TicketService);

  search(query: string, limit = 5): Observable<SearchResults> {
    if (!query || query.trim().length < 2) {
      return of({ groups: [], totalCount: 0, loading: false });
    }

    return forkJoin({
      tenants: this.tenantService.searchTenants(query, limit).pipe(
        catchError(() => of([] as Tenant[]))
      ),
      tickets: this.ticketService.searchTickets(query, limit).pipe(
        catchError(() => of([] as Ticket[]))
      )
    }).pipe(
      map(({ tenants, tickets }) => {
        const groups: SearchResultGroup[] = [];

        if (tenants.length > 0) {
          groups.push({
            type: 'Tenants',
            icon: 'building',
            items: tenants.map(tenant => ({
              id: tenant.id,
              title: tenant.companyName || tenant.name,
              subtitle: `${tenant.plan} - ${tenant.status}`,
              type: 'tenant' as const,
              link: `/tenants/${tenant.id}`
            }))
          });
        }

        if (tickets.length > 0) {
          groups.push({
            type: 'Tickets',
            icon: 'ticket',
            items: tickets.map(ticket => ({
              id: ticket.id,
              title: ticket.subject,
              subtitle: `${ticket.tenantName} - ${ticket.status}`,
              type: 'ticket' as const,
              link: `/support/tickets/${ticket.id}`
            }))
          });
        }

        return {
          groups,
          totalCount: tenants.length + tickets.length,
          loading: false
        };
      })
    );
  }
}
