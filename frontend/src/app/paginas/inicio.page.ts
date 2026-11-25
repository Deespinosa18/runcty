import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader,
  IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkDoneOutline, mapOutline, peopleOutline, speedometerOutline, trailSignOutline,
  warningOutline, walkOutline,
} from 'ionicons/icons';

/** Menú principal de RUNCTY. */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent,
    IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>RUNCTY · Loja</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card button routerLink="/recomendar" color="primary">
        <ion-card-header>
          <ion-card-subtitle>Indica zona, distancia y hora</ion-card-subtitle>
          <ion-card-title><ion-icon name="walk-outline"></ion-icon> Recomendar rutas seguras</ion-card-title>
        </ion-card-header>
        <ion-card-content>Las 3 rutas con mejor índice de seguridad (0-100).</ion-card-content>
      </ion-card>

      <ion-list>
        <ion-list-header>Gestión (CRUD)</ion-list-header>
        @for (op of opciones; track op.ruta) {
          <ion-item [routerLink]="op.ruta" detail>
            <ion-icon slot="start" [name]="op.icono" color="primary"></ion-icon>
            <ion-label><h2>{{ op.titulo }}</h2><p>{{ op.texto }}</p></ion-label>
          </ion-item>
        }
      </ion-list>
      <p class="ion-padding" style="font-size: .8rem; color: var(--ion-color-medium)">
        Prototipo académico · datos de rutas e índices sintéticos.
      </p>
    </ion-content>
  `,
})
export class InicioPage {
  protected readonly opciones = [
    { ruta: '/rutas', titulo: 'Rutas', texto: 'Recorridos y sus factores de seguridad', icono: 'trail-sign-outline' },
    { ruta: '/zonas', titulo: 'Zonas', texto: 'Sectores de Loja', icono: 'map-outline' },
    { ruta: '/incidentes', titulo: 'Incidentes', texto: 'Reportes de los corredores', icono: 'warning-outline' },
    { ruta: '/evaluaciones', titulo: 'Evaluaciones', texto: 'Índices calculados', icono: 'speedometer-outline' },
    { ruta: '/corredores', titulo: 'Corredores', texto: 'Usuarios de la app', icono: 'people-outline' },
    { ruta: '/consentimientos', titulo: 'Consentimientos', texto: 'Aceptación antes del primer uso', icono: 'checkmark-done-outline' },
  ];

  constructor() {
    addIcons({
      checkmarkDoneOutline, mapOutline, peopleOutline, speedometerOutline, trailSignOutline,
      warningOutline, walkOutline,
    });
  }
}
