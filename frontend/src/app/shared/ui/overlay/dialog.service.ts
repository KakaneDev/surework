import { Injectable, inject, ComponentRef, Type, Injector, createComponent, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface DialogConfig<T = unknown> {
  data?: T;
  width?: string;
  maxWidth?: string;
  disableClose?: boolean;
  panelClass?: string;
}

export interface DialogRef<R = unknown> {
  close: (result?: R) => void;
  afterClosed: () => Promise<R | undefined>;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);
  private readonly environmentInjector = inject(EnvironmentInjector);

  private activeDialogs: ComponentRef<unknown>[] = [];

  open<T, R = unknown>(
    component: Type<T>,
    config: DialogConfig = {}
  ): DialogRef<R> {
    let resolveClose: (result: R | undefined) => void;
    const afterClosedPromise = new Promise<R | undefined>((resolve) => {
      resolveClose = resolve;
    });

    // Create backdrop
    const backdrop = this.document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-40 animate-fade-in';

    // Create dialog container
    const container = this.document.createElement('div');
    container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    // Create dialog panel
    const panel = this.document.createElement('div');
    panel.className = `bg-white dark:bg-dark-surface rounded-xl shadow-dropdown animate-slide-up ${config.panelClass || ''}`;
    panel.style.width = config.width || 'auto';
    panel.style.maxWidth = config.maxWidth || '32rem';
    panel.style.maxHeight = '90vh';
    panel.style.overflow = 'auto';

    const dialogRef: DialogRef<R> = {
      close: (result?: R) => {
        this.closeDialog(backdrop, container, componentRef);
        resolveClose(result);
      },
      afterClosed: () => afterClosedPromise
    };

    // Create component with injector that provides dialog ref and data
    const dialogInjector = Injector.create({
      providers: [
        { provide: 'DIALOG_REF', useValue: dialogRef },
        { provide: 'DIALOG_DATA', useValue: config.data }
      ],
      parent: this.injector
    });

    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: dialogInjector
    });

    this.appRef.attachView(componentRef.hostView);
    panel.appendChild(componentRef.location.nativeElement);
    container.appendChild(panel);
    this.document.body.appendChild(backdrop);
    this.document.body.appendChild(container);

    // Handle backdrop click
    if (!config.disableClose) {
      container.addEventListener('click', (event) => {
        if (event.target === container) {
          dialogRef.close();
        }
      });

      // Handle escape key
      const escHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dialogRef.close();
          this.document.removeEventListener('keydown', escHandler);
        }
      };
      this.document.addEventListener('keydown', escHandler);
    }

    // Prevent body scroll
    this.document.body.style.overflow = 'hidden';

    this.activeDialogs.push(componentRef);

    return dialogRef;
  }

  private closeDialog(
    backdrop: HTMLElement,
    container: HTMLElement,
    componentRef: ComponentRef<unknown>
  ): void {
    backdrop.remove();
    container.remove();
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();

    this.activeDialogs = this.activeDialogs.filter(d => d !== componentRef);

    if (this.activeDialogs.length === 0) {
      this.document.body.style.overflow = '';
    }
  }

  closeAll(): void {
    // Note: This requires tracking all open dialogs and their refs
    // For now, just restore body overflow
    this.document.body.style.overflow = '';
  }
}
