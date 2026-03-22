# Candidate Documents Tab Implementation

**Date**: 2026-01-23
**Status**: Completed
**Branch**: 001-surework-sme-erp

---

## Overview

Added document management functionality to the candidate detail page, allowing recruiters to upload, view, download, and delete candidate documents such as CVs, ID documents, qualifications, and certifications.

---

## Files Modified

| File | Type | Description |
|------|------|-------------|
| `frontend/src/app/core/services/document.service.ts` | Modified | Added CANDIDATE to OwnerType, added getCandidateDocuments() |
| `frontend/src/app/features/recruitment/candidate-detail/candidate-detail.component.ts` | Modified | Added Documents tab with full functionality |

---

## Detailed Changes

### 1. DocumentService (`document.service.ts`)

#### OwnerType Update (Line 42)

**Before:**
```typescript
export type OwnerType = 'EMPLOYEE' | 'COMPANY' | 'DEPARTMENT';
```

**After:**
```typescript
export type OwnerType = 'EMPLOYEE' | 'COMPANY' | 'DEPARTMENT' | 'CANDIDATE';
```

#### New Method Added

```typescript
/**
 * Get all documents for a candidate.
 */
getCandidateDocuments(candidateId: string): Observable<EmployeeDocument[]> {
  return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/owner/CANDIDATE/${candidateId}`);
}
```

---

### 2. CandidateDetailComponent (`candidate-detail.component.ts`)

#### New Imports Added

```typescript
import { ElementRef, ViewChild } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DocumentService, EmployeeDocument, DocumentCategory } from '../../../core/services/document.service';
```

#### Component Imports Array Updated

Added:
- `MatProgressBarModule`
- `MatDividerModule`

#### New State Properties

```typescript
// Document state
documents = signal<EmployeeDocument[]>([]);
loadingDocuments = signal(false);
documentsError = signal(false);
uploading = signal(false);
uploadProgress = signal(0);
uploadingFileName = signal('');
candidateId = '';

@ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
```

#### Service Injection

```typescript
private readonly documentService = inject(DocumentService);
```

#### ngOnInit Updated

```typescript
ngOnInit(): void {
  const candidateId = this.route.snapshot.paramMap.get('id');
  if (candidateId) {
    this.candidateId = candidateId;
    this.loadCandidate(candidateId);
    this.loadApplications(candidateId);
    this.loadDocuments(candidateId);  // Added
  } else {
    this.error.set('Candidate ID not found');
    this.loading.set(false);
  }
}
```

#### New Document Methods

```typescript
// Load documents from API
loadDocuments(candidateId: string): void {
  this.loadingDocuments.set(true);
  this.documentsError.set(false);
  this.documentService.getCandidateDocuments(candidateId).subscribe({
    next: (docs) => {
      this.documents.set(docs);
      this.loadingDocuments.set(false);
    },
    error: () => {
      this.loadingDocuments.set(false);
      this.documentsError.set(true);
    }
  });
}

// Handle file upload with progress tracking
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  this.uploadingFileName.set(file.name);
  this.uploading.set(true);
  this.uploadProgress.set(0);

  const category = this.detectCategory(file.name);
  const candidate = this.candidate();

  const metadata = {
    name: file.name.replace(/\.[^/.]+$/, ''),
    category,
    ownerType: 'CANDIDATE' as const,
    ownerId: this.candidateId,
    ownerName: candidate?.fullName
  };

  const uploaderId = '00000000-0000-0000-0000-000000000100';

  this.documentService.uploadDocument(file, metadata, uploaderId).subscribe({
    next: (event) => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
      } else if (event.type === HttpEventType.Response) {
        this.uploading.set(false);
        this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
        this.loadDocuments(this.candidateId);
      }
    },
    error: (err) => {
      this.uploading.set(false);
      this.snackBar.open('Failed to upload document', 'Close', { duration: 3000 });
      console.error('Upload error:', err);
    }
  });

  input.value = '';
}

// Auto-detect document category from filename
detectCategory(fileName: string): DocumentCategory {
  const lower = fileName.toLowerCase();
  if (lower.includes('cv') || lower.includes('resume')) return 'CV';
  if (lower.includes('id') || lower.includes('identity')) return 'ID_DOCUMENT';
  if (lower.includes('passport')) return 'PASSPORT';
  if (lower.includes('degree') || lower.includes('diploma') || lower.includes('qualification')) return 'QUALIFICATION';
  if (lower.includes('certificate') || lower.includes('cert')) return 'CERTIFICATION';
  if (lower.includes('training')) return 'TRAINING_CERTIFICATE';
  return 'OTHER';
}

// Download document
downloadDocument(doc: EmployeeDocument): void {
  this.documentService.downloadDocument(doc.id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: () => {
      this.snackBar.open('Failed to download document', 'Close', { duration: 3000 });
    }
  });
}

// Delete document with confirmation
deleteDocument(doc: EmployeeDocument): void {
  if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

  this.documentService.deleteDocument(doc.id).subscribe({
    next: () => {
      this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
      this.loadDocuments(this.candidateId);
    },
    error: () => {
      this.snackBar.open('Failed to delete document', 'Close', { duration: 3000 });
    }
  });
}

// Helper methods
getConfidentialCount(): number {
  return this.documents().filter(d => d.confidential).length;
}

getCategoryLabel(category: string): string {
  return DocumentService.getCategoryLabel(category);
}

getCategoryIcon(category: string): string {
  return DocumentService.getCategoryIcon(category);
}

formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
```

---

## Document Categories for Candidates

Auto-detection based on filename keywords:

| Category | Filename Keywords | Icon |
|----------|-------------------|------|
| CV | cv, resume | person |
| ID_DOCUMENT | id, identity | badge |
| PASSPORT | passport | public |
| QUALIFICATION | degree, diploma, qualification | school |
| CERTIFICATION | certificate, cert | verified |
| TRAINING_CERTIFICATE | training | military_tech |
| OTHER | (fallback) | folder |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Profile] [Applications (3)] [Source] [Documents]          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📁 Candidate Documents          [+ Upload Document]     ││
│  │    Manage CVs, IDs, qualifications and more             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  📄 4 Total Documents  🔒 1 Confidential                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📋 CV - John_Smith_Resume.pdf                          ││
│  │    CV/Resume • 245 KB • Jan 15, 2026          [⬇] [⋮] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 🎓 BSc_Computer_Science.pdf                            ││
│  │    Qualification • 1.2 MB • Jan 12, 2026      [⬇] [⋮] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 🔖 AWS_Certification.pdf                                ││
│  │    Certification • 890 KB • Jan 10, 2026      [⬇] [⋮] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 🪪 ID_Document.pdf                     🔒              ││
│  │    ID Document • 520 KB • Jan 8, 2026         [⬇] [⋮] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## States Handled

1. **Loading State** - Spinner while fetching documents
2. **Error State** - Displayed when document service is unavailable, with retry button
3. **Empty State** - Shown when no documents exist, with upload prompt
4. **Upload Progress** - Progress bar during file upload
5. **Document List** - Cards showing document details with actions

---

## Dependencies

- Backend document-service running on port 8088
- Proxy configured for `/api/documents` to port 8088

---

## Testing Checklist

- [ ] Navigate to `/recruitment/candidates/:id`
- [ ] Verify Documents tab appears in the tab group
- [ ] Empty state displays correctly with upload prompt
- [ ] Upload a document (e.g., CV.pdf)
- [ ] Progress bar shows during upload
- [ ] Document appears in list after upload
- [ ] Download the document - file downloads correctly
- [ ] Delete the document - confirm dialog, then removed from list
- [ ] Category detection - upload "resume.pdf", verify category shows "CV/Resume"
- [ ] Error state - stop document-service, verify error message displays

---

## Build Verification

```bash
cd frontend && npx ng build --configuration development
```

**Result**: Build successful with no errors.
