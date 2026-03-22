import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <app-sidebar
        [isOpen]="sidebarOpen()"
        (closeSidebar)="sidebarOpen.set(false)"
      />

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <app-header (toggleSidebar)="toggleSidebar()" />

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Mobile sidebar backdrop -->
    @if (sidebarOpen()) {
      <div
        class="sidebar-backdrop"
        (click)="sidebarOpen.set(false)"
      ></div>
    }
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .main-content {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow-x: hidden;
    }

    .page-content {
      flex: 1;
      width: 100%;
      max-width: 1536px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    @media (min-width: 768px) {
      .page-content {
        padding: 2rem;
      }
    }

    @media (min-width: 1024px) {
      .page-content {
        padding: 2rem 2.5rem;
      }
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease-out;
    }

    @media (min-width: 1024px) {
      .sidebar-backdrop {
        display: none;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class AppLayoutComponent {
  sidebarOpen = signal(true);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}
