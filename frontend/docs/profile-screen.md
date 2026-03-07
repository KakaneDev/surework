# Profile Screen

**Date:** 2026-01-25
**Status:** Implemented
**Version:** 1.0

---

## Overview

The Profile Screen provides authenticated users with a comprehensive read-only view of their personal information, employment details, and account settings. Users can also upload and manage their profile avatar.

---

## Features

### 1. Profile Header

The header section displays key user information at a glance:

- **Avatar**: Circular profile photo with upload functionality
- **Full Name**: User's first and last name
- **Email**: User's email address
- **Employee Number**: Badge showing employee ID
- **Job Title**: Badge showing current position
- **Department**: Badge showing department name
- **Status**: Employment status badge (Active, On Leave, etc.)

#### Avatar Upload
- Click on avatar to upload a new image
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB
- Shows upload progress indicator
- Updates immediately after successful upload

---

### 2. Tabbed Content

The profile content is organized into 5 tabs:

#### Personal Tab
Displays personal information:
| Field | Description |
|-------|-------------|
| Full Name | First, middle, and last name |
| Email | Contact email address |
| Phone | Phone number |
| ID Number | South African ID (masked: ****1234) |
| Date of Birth | Formatted date |
| Gender | Male/Female/Other |
| Marital Status | Single/Married/etc. |
| Address | Full street address |

#### Employment Tab
Displays employment details:
| Field | Description |
|-------|-------------|
| Employee Number | Unique employee identifier |
| Department | Department name |
| Job Title | Current position |
| Manager | Direct manager name |
| Employment Type | Full-time/Part-time/Contract |
| Hire Date | Date of employment start |
| Status | Employment status with badge |

#### Banking Tab
Displays banking information (masked for security):
| Field | Description |
|-------|-------------|
| Bank Name | Financial institution |
| Account Number | Masked (****1234) |
| Branch Code | Bank branch code |
| Account Type | Savings/Cheque/etc. |

*Note: Contact HR to update banking details*

#### Emergency Tab
Displays emergency contact:
| Field | Description |
|-------|-------------|
| Contact Name | Emergency contact person |
| Phone Number | Contact phone |
| Relationship | Spouse/Parent/Sibling/etc. |

*Note: Contact HR to update emergency contact*

#### Account Tab
Displays user account information:
| Field | Description |
|-------|-------------|
| User ID | System user identifier |
| Email | Login email |
| MFA Status | Enabled/Disabled badge |
| Roles | List of assigned roles as badges |
| Permissions | Count of granted permissions |

*Note: Security settings managed in Settings page*

---

## Navigation

### Route
```
/profile
```

### Sidebar
The profile can be accessed from the user dropdown menu in the header.

### Route Configuration
```typescript
// app.routes.ts
{
  path: 'profile',
  // Any authenticated user can access their own profile
  loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
}
```

---

## Technical Implementation

### Data Sources

The profile screen uses two data sources:

1. **Current User** (from NgRx store)
   - Selector: `selectCurrentUser`
   - Contains: userId, email, roles, permissions, mfaEnabled

2. **Employee Data** (from API)
   - Service: `EmployeeService.getEmployee(employeeId)`
   - Contains: Full employee profile data

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/employees/{id}` | GET | Fetch employee profile data |
| `/api/admin/users/{userId}/avatar` | POST | Upload user avatar |
| `/api/admin/users/{userId}/avatar` | DELETE | Delete user avatar |

### Avatar Upload Flow

1. User clicks on avatar
2. File input triggers file selection dialog
3. Frontend validates file type and size
4. If valid, FormData sent to backend
5. Backend stores image and returns URL
6. Frontend updates avatar display
7. User data refreshed in store

### Component Structure

```typescript
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerComponent,
    BadgeComponent,
    TabsComponent,
    TabPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  // Signals for reactive state
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  employee = signal<Employee | null>(null);
  loading = signal(true);
  activeTab = signal(0);
  avatarUploading = signal(false);
  avatarUrl = signal<string | null>(null);
}
```

---

## File Structure

```
frontend/src/app/
├── features/
│   └── profile/
│       └── profile.component.ts    # Main profile component
├── core/
│   └── services/
│       └── auth.service.ts         # Added: uploadAvatar, deleteAvatar
└── app.routes.ts                   # Added: /profile route

services/admin-service/src/main/java/com/surework/admin/
├── controller/
│   └── AdminController.java        # Added: avatar endpoints
├── service/
│   ├── AdminService.java           # Added: avatar method signatures
│   └── AdminServiceImpl.java       # Added: avatar implementations
└── dto/
    └── AdminDto.java               # Added: AvatarResponse record
```

---

## Backend Implementation

### Avatar Upload Endpoint

```java
@PostMapping("/users/{userId}/avatar")
public ResponseEntity<AvatarResponse> uploadAvatar(
        @PathVariable UUID userId,
        @RequestPart("file") MultipartFile file) {
    AvatarResponse response = adminService.uploadAvatar(
            userId,
            file.getBytes(),
            file.getOriginalFilename(),
            file.getContentType()
    );
    return ResponseEntity.ok(response);
}
```

### Avatar Delete Endpoint

```java
@DeleteMapping("/users/{userId}/avatar")
public ResponseEntity<Void> deleteAvatar(@PathVariable UUID userId) {
    adminService.deleteAvatar(userId);
    return ResponseEntity.noContent().build();
}
```

### Service Implementation

```java
@Override
public AvatarResponse uploadAvatar(UUID userId, byte[] fileData, String fileName, String contentType) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Validate content type and size
    if (!contentType.startsWith("image/")) {
        throw new IllegalArgumentException("File must be an image");
    }
    if (fileData.length > 5 * 1024 * 1024) {
        throw new IllegalArgumentException("File size must be less than 5MB");
    }

    // Store as base64 (in production, use cloud storage)
    String base64Data = Base64.getEncoder().encodeToString(fileData);
    String avatarUrl = "data:" + contentType + ";base64," + base64Data;

    user.setAvatarUrl(avatarUrl);
    userRepository.save(user);

    return new AvatarResponse(avatarUrl);
}
```

---

## Responsive Design

The profile screen is fully responsive:

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Single column, stacked header |
| Tablet (768-1024px) | Two column grid |
| Desktop (>1024px) | Two column grid with larger avatar |

---

## Dark Mode Support

All components use Tailwind CSS dark mode classes:
- Background: `dark:bg-dark-surface`
- Text: `dark:text-neutral-200`
- Borders: `dark:border-dark-border`
- Cards: `dark:bg-dark-elevated`

---

## Security Considerations

1. **Read-Only**: Most profile data is read-only (HR manages changes)
2. **Data Masking**: Sensitive data (ID number, bank account) is masked
3. **Avatar Validation**: File type and size validated on both frontend and backend
4. **Authentication**: Route requires authentication
5. **Authorization**: Users can only view/edit their own profile

---

## Testing

### E2E Tests

Located in `frontend/e2e/profile.spec.ts`:

1. **Navigation Tests**
   - User can access /profile page
   - Profile loads user data correctly

2. **Header Tests**
   - Avatar displays correctly
   - User name and email visible
   - Employee badges visible

3. **Tab Navigation Tests**
   - All 5 tabs are visible
   - Tabs switch content correctly
   - Each tab shows appropriate content

4. **Avatar Upload Tests**
   - File input triggers on avatar click
   - Invalid file types rejected
   - Large files rejected
   - Success shows new avatar

### Running Tests

```bash
# Run all tests
npx playwright test

# Run only profile tests
npx playwright test profile

# Run with UI
npx playwright test profile --ui
```

---

## Future Enhancements

1. **Edit Mode**: Allow users to edit some personal details
2. **Avatar Cropping**: Add image cropping before upload
3. **Profile Completeness**: Show percentage of profile completed
4. **Activity Log**: Show recent account activity
5. **Preferences**: Add notification and display preferences
6. **Export Profile**: Download profile data as PDF
