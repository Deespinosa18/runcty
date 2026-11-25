import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader,
  IonIcon, IonItem, IonLabel, IonList, IonRefresher, IonRefresherContent, IonSearchbar, IonText,
  IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';

import { mensajeError } from '../../core/crud-api';
import { Evaluacion } from '../../core/modelos';
import { EvaluacionesApi } from '../../core/runcty-api.service';

/** Lista de evaluaciones: buscar, abrir el detalle, crear (+) y eliminar. */
@Component({
  selector: 'app-evaluaciones-lista',
  imports: [
    DatePipe, RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonFab, IonFabButton,
    IonHeader, IonIcon, IonItem, IonLabel, IonList, IonRefresher, IonRefresherContent, IonSearchbar,
    IonText, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/inicio"></ion-back-button></ion-buttons>
        <ion-title>Evaluaciones</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar placeholder="Buscar" (ionInput)="busqueda.set($any($event).detail.value ?? '')"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="cargar($any($event).target)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (error()) {
        <ion-text color="danger"><p class="ion-padding">{{ error() }}</p></ion-text>
      }

      <ion-list>
        @for (x of filtrados(); track x.id) {
          <ion-item [routerLink]="['/evaluaciones', x.id]" detail>
            <ion-label>
              <h2>{{ x.ruta_nombre }} · índice {{ x.indice }}/100</h2>
              <p>Salida {{ x.hora_salida.slice(0, 5) }} · {{ x.corredor_alias || 'Sin corredor' }} · {{ x.fecha | date: 'dd/MM/yyyy HH:mm' }}</p>
            </ion-label>
            <ion-button slot="end" fill="clear" color="danger" aria-label="Eliminar"
              (click)="$event.stopPropagation(); $event.preventDefault(); eliminar(x)">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-button>
          </ion-item>
        } @empty {
          <p class="ion-padding">No hay evaluaciones. Pulsa + para crear.</p>
        }
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/evaluaciones/nuevo" aria-label="Nuevo">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class EvaluacionesListaPage {
  private readonly api = inject(EvaluacionesApi);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);

  protected readonly items = signal<Evaluacion[]>([]);
  protected readonly error = signal('');
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.items().filter((x) => (x.ruta_nombre).toLowerCase().includes(texto));
  });
  

  constructor() {
    addIcons({ add, trash });
  }

  /** Ionic llama a este método cada vez que se vuelve a la página. */
  ionViewWillEnter(): void {
    this.cargar();
  }

  protected cargar(refresher?: { complete(): void }): void {
    this.api.listar().subscribe({
      next: (lista) => { this.items.set(lista); this.error.set(''); refresher?.complete(); },
      error: (e) => { this.error.set(mensajeError(e)); refresher?.complete(); },
    });
  }

  protected async eliminar(x: Evaluacion): Promise<void> {
    const confirmar = await this.alerta.create({
      header: 'Eliminar evaluación',
      message: '¿Seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.borrar(x.id) },
      ],
    });
    await confirmar.present();
  }

  private borrar(id: number): void {
    this.api.eliminar(id).subscribe({
      next: () => { this.items.update((l) => l.filter((x) => x.id !== id)); void this.aviso('Eliminado.', 'success'); },
      error: (e) => void this.aviso(mensajeError(e), 'danger'),
    });
  }

  private async aviso(message: string, color: string): Promise<void> {
    await (await this.toast.create({ message, color, duration: 3000 })).present();
  }
}
