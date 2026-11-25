import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

import { mensajeError } from '../../core/crud-api';
import { Evaluacion } from '../../core/modelos';
import { EvaluacionesApi } from '../../core/runcty-api.service';

/** Detalle de un(a) evaluación con las acciones Editar y Eliminar. */
@Component({
  selector: 'app-evaluaciones-detalle',
  imports: [
    DatePipe, RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon,
    IonItem, IonLabel, IonList, IonText, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/evaluaciones"></ion-back-button></ion-buttons>
        <ion-title>Detalle de evaluación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (error()) {
        <ion-text color="danger"><p>{{ error() }}</p></ion-text>
      }
      @if (item(); as x) {
        <ion-list>
          <ion-item><ion-label><p>Ruta</p><h2>{{ x.ruta_nombre }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Índice de seguridad</p><h2>{{ x.indice + ' / 100' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Hora de salida</p><h2>{{ x.hora_salida.slice(0, 5) }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Corredor</p><h2>{{ x.corredor_alias || '—' }}</h2></ion-label></ion-item>
          <ion-item><ion-label><p>Fecha de cálculo</p><h2>{{ x.fecha | date: 'dd/MM/yyyy HH:mm' }}</h2></ion-label></ion-item>
        </ion-list>
        <ion-button expand="block" [routerLink]="['/evaluaciones', x.id, 'editar']">
          <ion-icon slot="start" name="create"></ion-icon> Editar
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" (click)="eliminar(x)">
          <ion-icon slot="start" name="trash"></ion-icon> Eliminar
        </ion-button>
      }
    </ion-content>
  `,
})
export class EvaluacionesDetallePage {
  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(EvaluacionesApi);
  private readonly router = inject(Router);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);

  protected readonly item = signal<Evaluacion | null>(null);
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

  protected async eliminar(x: Evaluacion): Promise<void> {
    const confirmar = await this.alerta.create({
      header: 'Eliminar evaluación',
      message: '¿Seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => this.api.eliminar(x.id).subscribe({
            next: () => void this.router.navigate(['/evaluaciones'], { replaceUrl: true }),
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
