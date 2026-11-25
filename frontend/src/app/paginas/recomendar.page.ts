import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSelect,
  IonSelectOption, IonSpinner, IonText, IonTitle, IonToolbar,
} from '@ionic/angular';

import { mensajeError } from '../core/crud-api';
import { Corredor, DIFICULTADES, Recomendacion, Zona } from '../core/modelos';
import { CorredoresApi, RutasApi, ZonasApi } from '../core/runcty-api.service';

/** Regla principal de RUNCTY: recomienda las 3 rutas más seguras (POST /api/rutas/recomendar/). */
@Component({
  selector: 'app-recomendar',
  imports: [
    DecimalPipe, ReactiveFormsModule, RouterLink, IonBackButton, IonButton, IonButtons, IonCard,
    IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonInput,
    IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonSpinner, IonText, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/inicio"></ion-back-button></ion-buttons>
        <ion-title>Recomendar rutas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p>Indica por dónde, cuánto y a qué hora quieres correr.</p>
      <form [formGroup]="form" (ngSubmit)="buscar()">
        <ion-list>
          <ion-item>
            <ion-select label="Zona de Loja" labelPlacement="stacked" interface="popover"
              formControlName="zona" placeholder="Selecciona una zona">
              @for (z of zonas(); track z.id) { <ion-select-option [value]="z.id">{{ z.nombre }}</ion-select-option> }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input label="Distancia (km)" labelPlacement="stacked" type="number" formControlName="km"
              placeholder="5"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="Hora de salida" labelPlacement="stacked" type="time" formControlName="hora"></ion-input>
          </ion-item>
          <ion-item>
            <ion-select label="Corredor (opcional)" labelPlacement="stacked" interface="popover"
              formControlName="corredor">
              <ion-select-option [value]="null">Ninguno</ion-select-option>
              @for (c of corredores(); track c.id) { <ion-select-option [value]="c.id">{{ c.alias }}</ion-select-option> }
            </ion-select>
          </ion-item>
        </ion-list>
        <ion-button expand="block" type="submit" [disabled]="cargando()">
          @if (cargando()) { <ion-spinner name="dots"></ion-spinner> } @else { Buscar rutas }
        </ion-button>
      </form>

      @if (error()) {
        <ion-text color="danger"><p style="white-space: pre-line">{{ error() }}</p></ion-text>
      }

      @if (resultados(); as lista) {
        @if (lista.length === 0) {
          <p>No hay rutas para esa zona y distancia (± 0,5 km).</p>
        } @else {
          <h2>Rutas recomendadas</h2>
        }
        @for (r of lista; track r.ruta.id; let i = $index) {
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle>#{{ i + 1 }} · {{ r.ruta.km }} km · {{ r.ruta.desnivel }} m de desnivel
                · dificultad {{ dificultades[r.ruta.dificultad] }}</ion-card-subtitle>
              <ion-card-title>{{ r.ruta.nombre }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <span class="indice">{{ r.indice }}</span> / 100
              <ion-list lines="none">
                @for (a of r.aportes; track a.factor) {
                  <ion-item><ion-label>{{ a.factor }}</ion-label><ion-label slot="end">{{ a.puntos | number: '1.1-1' }}</ion-label></ion-item>
                }
              </ion-list>
              <ion-button fill="clear" size="small" [routerLink]="['/evaluaciones', r.evaluacion]">
                Ver evaluación guardada
              </ion-button>
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
})
export class RecomendarPage {
  private readonly rutasApi = inject(RutasApi);

  protected readonly zonas = signal<Zona[]>([]);
  protected readonly corredores = signal<Corredor[]>([]);
  protected readonly resultados = signal<Recomendacion[] | null>(null);
  protected readonly error = signal('');
  protected readonly cargando = signal(false);
  protected readonly dificultades = DIFICULTADES;

  protected readonly form = new FormGroup({
    zona: new FormControl<number | null>(null, Validators.required),
    km: new FormControl<number | null>(5, [Validators.required, Validators.min(0.1)]),
    hora: new FormControl('06:00', { nonNullable: true, validators: Validators.required }),
    corredor: new FormControl<number | null>(null),
  });

  constructor() {
    inject(ZonasApi).listar().subscribe({
      next: (l) => this.zonas.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
    inject(CorredoresApi).listar().subscribe((l) => this.corredores.set(l));
  }

  protected buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Selecciona una zona e ingresa una distancia mayor que cero.');
      return;
    }
    const { zona, km, hora, corredor } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set('');
    this.rutasApi.recomendar({ zona: zona!, km: Number(km), hora, corredor }).subscribe({
      next: (lista) => { this.resultados.set(lista); this.cargando.set(false); },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); },
    });
  }
}
