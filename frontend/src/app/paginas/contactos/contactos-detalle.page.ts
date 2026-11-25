import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

import { mensajeError } from '../../core/crud-api';
import { ContactoConfianza } from '../../core/modelos';
import { ContactosApi } from '../../core/runcty-api.service';

/** Detalle de un(a) contacto con las acciones Editar y Eliminar. */
@Component({
  selector: 'app-contactos-detalle',
  imports: [
    RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon,
    IonItem, IonLabel, IonList, IonText, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/contactos"></ion-back-button></ion-buttons>
        <ion-title>Detalle de contacto</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (error()) {
        <ion-text color="danger"><p>{{ error() }}</p></ion-text>
      }
      @if (item(); as x) {
        <ion-list>
          <ion-item><ion-label><p>Nombre</p><h2>{{ x.nombre }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Corredor</p><h2>{{ x.corredor_alias }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Teléfono</p><h2>{{ x.telefono || '—' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Correo</p><h2>{{ x.correo || '—' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Aviso por detención</p><h2>{{ x.minutos_detencion + ' minutos' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Activo</p><h2>{{ x.activo ? 'Sí' : 'No' }}</h2></ion-label></ion-item>
        </ion-list>
        <ion-button expand="block" [routerLink]="['/contactos', x.id, 'editar']">
          <ion-icon slot="start" name="create"></ion-icon> Editar
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" (click)="eliminar(x)">
          <ion-icon slot="start" name="trash"></ion-icon> Eliminar
        </ion-button>
      }
    </ion-content>
  `,
})
export class ContactosDetallePage {
  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(ContactosApi);
  private readonly router = inject(Router);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);

  protected readonly item = signal<ContactoConfianza | null>(null);
  protected readonly error = signal('');
  

  constructor() {
    addIcons({ create, trash });
  }

  ionViewWillEnter(): void {
    this.api.obtener(Number(this.id())).subscribe({
      next: (x) => { this.item.set(x); this.error.set(''); },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected async eliminar(x: ContactoConfianza): Promise<void> {
    const confirmar = await this.alerta.create({
      header: 'Eliminar contacto',
      message: '¿Seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => this.api.eliminar(x.id).subscribe({
            next: () => void this.router.navigate(['/contactos'], { replaceUrl: true }),
            error: async (e) => (await this.toast.create({
              message: mensajeError(e), color: 'danger', duration: 4000,
            })).present(),
          }),
        },
      ],
    });
    await confirmar.present();
  }
}
