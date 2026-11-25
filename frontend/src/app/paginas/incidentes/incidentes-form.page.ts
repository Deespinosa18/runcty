import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/crud-api';
import { Corredor, Incidente, Zona, ESTADOS_INCIDENTE, TIPOS_INCIDENTE } from '../../core/modelos';
import { CorredoresApi, IncidentesApi, ZonasApi } from '../../core/runcty-api.service';

/** Formulario para crear (/incidentes/nuevo) o editar (/incidentes/:id/editar) un(a) incidente. */
@Component({
  selector: 'app-incidentes-form',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/incidentes"></ion-back-button></ion-buttons>
        <ion-title>{{ id() ? 'Editar' : 'Nuevo' }} incidente</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item><ion-select label="Autor" labelPlacement="stacked" interface="popover" formControlName="autor" placeholder="Selecciona">
            @for (o of opcionesAutor(); track o.id) { <ion-select-option [value]="o.id">{{ o.alias }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-select label="Zona" labelPlacement="stacked" interface="popover" formControlName="zona" placeholder="Selecciona">
            @for (o of opcionesZona(); track o.id) { <ion-select-option [value]="o.id">{{ o.nombre }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-select label="Tipo" labelPlacement="stacked" interface="popover" formControlName="tipo">
            @for (op of tipos_incidente; track op[0]) { <ion-select-option [value]="op[0]">{{ op[1] }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-input label="Ubicación de prueba" labelPlacement="stacked" type="text" formControlName="ubicacion" placeholder="Punto ficticio"></ion-input></ion-item>
          <ion-item><ion-input label="Fecha y hora (Loja)" labelPlacement="stacked" type="datetime-local" formControlName="fecha"></ion-input></ion-item>
          <ion-item><ion-select label="Estado" labelPlacement="stacked" interface="popover" formControlName="estado">
            @for (op of estados_incidente; track op[0]) { <ion-select-option [value]="op[0]">{{ op[1] }}</ion-select-option> }
          </ion-select></ion-item>
        </ion-list>
        <ion-note><p>Usa ubicaciones ficticias: se muestran a otros corredores. El autor debe haber aceptado el consentimiento.</p></ion-note>

        @if (form.invalid && form.touched) {
          <ion-text color="danger"><p>Completa los campos obligatorios con valores válidos.</p></ion-text>
        }
        @if (error()) {
          <ion-text color="danger"><p style="white-space: pre-line">{{ error() }}</p></ion-text>
        }

        <ion-button expand="block" type="submit" [disabled]="guardando()">Guardar</ion-button>
      </form>
    </ion-content>
  `,
})
export class IncidentesFormPage implements OnInit {
  /** :id cuando se edita; vacío cuando se crea. */
  readonly id = input<string>();

  private readonly api = inject(IncidentesApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly opcionesAutor = signal<Corredor[]>([]);
  protected readonly opcionesZona = signal<Zona[]>([]);
  protected readonly estados_incidente = Object.entries(ESTADOS_INCIDENTE);
  protected readonly tipos_incidente = Object.entries(TIPOS_INCIDENTE);

  protected readonly form = new FormGroup({
    autor: new FormControl<number | null>(null, { validators: [Validators.required] }),
    zona: new FormControl<number | null>(null, { validators: [Validators.required] }),
    tipo: new FormControl<string>('OBSTACULO', { nonNullable: true, validators: [Validators.required] }),
    ubicacion: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    fecha: new FormControl<string>(ahoraLocal(), { nonNullable: true, validators: [Validators.required] }),
    estado: new FormControl<string>('SIN_CONFIRMAR', { nonNullable: true, validators: [] }),
  });

  constructor() {
    inject(CorredoresApi).listar().subscribe((l) => this.opcionesAutor.set(l));
    inject(ZonasApi).listar().subscribe((l) => this.opcionesZona.set(l));
  }

  ngOnInit(): void {
    if (this.id()) {
      this.api.obtener(Number(this.id())).subscribe({
        next: (x) => {
          const valores: Record<string, unknown> = { ...x };
          if (x.fecha) valores['fecha'] = x.fecha.slice(0, 16); // 'AAAA-MM-DDTHH:MM' para el input
          this.form.patchValue(valores);
        },
        error: (e) => this.error.set(mensajeError(e)),
      });
    }
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue() as unknown as Partial<Incidente>;
    const peticion = this.id()
      ? this.api.actualizar(Number(this.id()), datos)
      : this.api.crear(datos);
    this.guardando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: async (x) => {
        this.guardando.set(false);
        await (await this.toast.create({ message: 'Guardado.', color: 'success', duration: 2000 })).present();
        void this.router.navigate(['/incidentes', x.id], { replaceUrl: true });
      },
      error: (e) => {
        this.guardando.set(false);
        // Muestra los errores de validación que devuelve Django (400).
        this.error.set(mensajeError(e));
      },
    });
  }
}

/** Fecha y hora actual en formato del input datetime-local. */
function ahoraLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
