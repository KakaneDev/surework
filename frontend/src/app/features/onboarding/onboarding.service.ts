import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Signup request matching backend SignupDto.SignupRequest
 */
export interface SignupRequest {
  // Account Information
  email: string;
  password: string;
  firstName: string;
  lastName: string;

  // Company Details
  companyName: string;
  tradingName?: string;
  registrationNumber: string;
  companyType: string;
  industrySector: string;

  // SARS Compliance
  taxNumber: string;
  vatNumber?: string;
  uifReference: string;
  sdlNumber: string;
  payeReference: string;

  // Contact Information
  phone: string;
  companyEmail: string;

  // Address
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;

  // Terms
  acceptTerms: boolean;
}

/**
 * Signup response from backend
 */
export interface SignupResponse {
  tenantId: string;
  subdomain: string;
  message: string;
}

/**
 * Availability check response
 */
export interface AvailabilityResponse {
  available: boolean;
  message: string;
}

/**
 * Company type enum
 */
export interface CompanyType {
  name: string;
  displayName: string;
}

/**
 * Industry sector enum
 */
export interface IndustrySector {
  name: string;
  displayName: string;
}

/**
 * Province enum
 */
export interface Province {
  name: string;
  displayName: string;
}

/**
 * Service for onboarding/signup operations
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/signup';

  /**
   * Submit signup request
   */
  signup(request: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(this.apiUrl, request);
  }

  /**
   * Check if email is available
   */
  checkEmailAvailability(email: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/check-email`, {
      params: { email }
    });
  }

  /**
   * Check if registration number is available
   */
  checkRegistrationNumberAvailability(registrationNumber: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/check-registration`, {
      params: { registrationNumber }
    });
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-verification`, null, {
      params: { email }
    });
  }

  /**
   * Get available company types
   */
  getCompanyTypes(): Observable<CompanyType[]> {
    return this.http.get<CompanyType[]>(`${this.apiUrl}/company-types`);
  }

  /**
   * Get available industry sectors
   */
  getIndustrySectors(): Observable<IndustrySector[]> {
    return this.http.get<IndustrySector[]>(`${this.apiUrl}/industry-sectors`);
  }

  /**
   * Get available provinces
   */
  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/provinces`);
  }
}

/**
 * Static data for company types (used when API is not available)
 */
export const COMPANY_TYPES: CompanyType[] = [
  { name: 'PRIVATE_COMPANY', displayName: 'Private Company (Pty) Ltd' },
  { name: 'PUBLIC_COMPANY', displayName: 'Public Company Ltd' },
  { name: 'PERSONAL_LIABILITY', displayName: 'Personal Liability Company Inc' },
  { name: 'STATE_OWNED', displayName: 'State Owned Company (SOC) Ltd' },
  { name: 'NON_PROFIT', displayName: 'Non-Profit Company (NPC)' },
  { name: 'SOLE_PROPRIETOR', displayName: 'Sole Proprietor' },
  { name: 'PARTNERSHIP', displayName: 'Partnership' },
  { name: 'CLOSE_CORPORATION', displayName: 'Close Corporation (CC)' },
  { name: 'COOPERATIVE', displayName: 'Cooperative' },
  { name: 'TRUST', displayName: 'Trust' }
];

/**
 * Static data for industry sectors (used when API is not available)
 */
export const INDUSTRY_SECTORS: IndustrySector[] = [
  { name: 'AGRICULTURE', displayName: 'Agriculture, Forestry and Fishing' },
  { name: 'MINING', displayName: 'Mining and Quarrying' },
  { name: 'MANUFACTURING', displayName: 'Manufacturing' },
  { name: 'UTILITIES', displayName: 'Electricity, Gas and Water Supply' },
  { name: 'CONSTRUCTION', displayName: 'Construction' },
  { name: 'WHOLESALE_RETAIL', displayName: 'Wholesale and Retail Trade' },
  { name: 'TRANSPORT', displayName: 'Transport, Storage and Communication' },
  { name: 'FINANCIAL_SERVICES', displayName: 'Financial Intermediation and Insurance' },
  { name: 'REAL_ESTATE', displayName: 'Real Estate and Business Services' },
  { name: 'PROFESSIONAL_SERVICES', displayName: 'Professional, Scientific and Technical Services' },
  { name: 'PUBLIC_ADMINISTRATION', displayName: 'Public Administration' },
  { name: 'EDUCATION', displayName: 'Education' },
  { name: 'HEALTH_SOCIAL', displayName: 'Health and Social Work' },
  { name: 'HOSPITALITY', displayName: 'Hotels and Restaurants' },
  { name: 'ICT', displayName: 'Information and Communication Technology' },
  { name: 'ARTS_ENTERTAINMENT', displayName: 'Arts, Entertainment and Recreation' },
  { name: 'OTHER_SERVICES', displayName: 'Other Service Activities' }
];

/**
 * Static data for provinces (used when API is not available)
 */
export const PROVINCES: Province[] = [
  { name: 'EC', displayName: 'Eastern Cape' },
  { name: 'FS', displayName: 'Free State' },
  { name: 'GP', displayName: 'Gauteng' },
  { name: 'KZN', displayName: 'KwaZulu-Natal' },
  { name: 'LP', displayName: 'Limpopo' },
  { name: 'MP', displayName: 'Mpumalanga' },
  { name: 'NC', displayName: 'Northern Cape' },
  { name: 'NW', displayName: 'North West' },
  { name: 'WC', displayName: 'Western Cape' }
];
