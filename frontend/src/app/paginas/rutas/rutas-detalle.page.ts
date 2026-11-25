import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

import { mensajeError } from '../../core/crud-api';
import { Ruta, SUPERFICIES, DIFICULTADES } from '../../core/modelos';
import { RutasApi } from '../../core/runcty-api.service';

/** Detalle de un(a) ruta con las acciones Editar y Eliminar. */
@Component({
  selector: 'app-rutas-detalle',
  imports: [
    RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon,
    IonItem, IonLabel, IonList, IonText, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/rutas"></ion-back-button></ion-buttons>
        <ion-title>Detalle de ruta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (error()) {
        <ion-text color="danger"><p>{{ error() }}</p></ion-text>
      }
      @if (item(); as x) {
        <ion-list>
          <ion-item><ion-label><p>Zona</p><h2>{{ x.zona_nombre }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Sugerida por</p><h2>{{ x.club_nombre || '—' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Calificación promedio</p><h2>{{ x.calificacion_promedio !== null ? x.calificacion_promedio + ' / 5 (' + x.total_calificaciones + ')' : 'Sin calificaciones' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Distancia</p><h2>{{ x.km + ' km' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Desnivel</p><h2>{{ x.desnivel + ' m' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Superficie</p><h2>{{ superficies[x.superficie] }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Dificultad</p><h2>{{ dificultades[x.dificultad] }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Iluminación</p><h2>{{ x.iluminacion + ' / 100' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Afluencia</p><h2>{{ x.afluencia + ' / 100' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Puntos de apoyo</p><h2>{{ x.apoyo + ' / 100' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Incidentes históricos</p><h2>{{ x.incidentes_base }}</h2></ion-label></ion-item>
        </ion-list>
        <ion-button expand="block" [routerLink]="['/rutas', x.id, 'editar']">
          <ion-icon slot="start" name="create"></ion-icon> Editar
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" (click)="eliminar(x)">
          <ion-icon slot="start" name="trash"></ion-icon> Eliminar
        </ion-button>
      }
    </ion-content>
  `,
})
export class RutasDetallePage {
  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(RutasApi);
  private readonly router = inject(Router);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);

  protected readonly item = signal<Ruta | null>(null);
  protected readonly error = signal('');
  protected readonly superficies = SUPERFICIES;
  protected readonly dificultades = DIFICULTADES;

  constructor() {
    addIcons({ create, trash });
  }

  ionViewWillEnter(): void {
    this.api.obtener(Number(this.id())).subscribe({
      next: (x) => { this.item.set(x); this.error.set(''); },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected async eliminar(x: Ruta): Promise<void> {
    const confirmar = await this.alerta.create({
      header: 'Eliminar ruta',
      message: '¿Seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => this.api.eliminar(x.id).subscribe({
            next: () => void this.router.navigate(['/rutas'], { replaceUrl: true }),
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
