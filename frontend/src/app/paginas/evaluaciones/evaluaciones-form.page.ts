import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/crud-api';
import { Corredor, Evaluacion, Ruta } from '../../core/modelos';
import { CorredoresApi, EvaluacionesApi, RutasApi } from '../../core/runcty-api.service';

/** Formulario para crear (/evaluaciones/nuevo) o editar (/evaluaciones/:id/editar) un(a) evaluación. */
@Component({
  selector: 'app-evaluaciones-form',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/evaluaciones"></ion-back-button></ion-buttons>
        <ion-title>{{ id() ? 'Editar' : 'Nuevo' }} evaluación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item><ion-select label="Ruta" labelPlacement="stacked" interface="popover" formControlName="ruta" placeholder="Selecciona">
            @for (o of opcionesRuta(); track o.id) { <ion-select-option [value]="o.id">{{ o.nombre }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-select label="Corredor (opcional)" labelPlacement="stacked" interface="popover" formControlName="corredor" placeholder="Selecciona">
            <ion-select-option [value]="null">Ninguno</ion-select-option>
            @for (o of opcionesCorredor(); track o.id) { <ion-select-option [value]="o.id">{{ o.alias }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-input label="Hora de salida" labelPlacement="stacked" type="time" formControlName="hora_salida"></ion-input></ion-item>
        </ion-list>
        <ion-note><p>El índice de seguridad lo calcula el backend con la iluminación, la afluencia, los incidentes, los puntos de apoyo y la hora de salida.</p></ion-note>

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
export class EvaluacionesFormPage implements OnInit {
  /** :id cuando se edita; vacío cuando se crea. */
  readonly id = input<string>();

  private readonly api = inject(EvaluacionesApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly opcionesRuta = signal<Ruta[]>([]);
  protected readonly opcionesCorredor = signal<Corredor[]>([]);
  

  protected readonly form = new FormGroup({
    ruta: new FormControl<number | null>(null, { validators: [Validators.required] }),
    corredor: new FormControl<number | null>(null, { validators: [] }),
    hora_salida: new FormControl<string>('06:00', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    inject(RutasApi).listar().subscribe((l) => this.opcionesRuta.set(l));
    inject(CorredoresApi).listar().subscribe((l) => this.opcionesCorredor.set(l));
  }

  ngOnInit(): void {
    if (this.id()) {
      this.api.obtener(Number(this.id())).subscribe({
        next: (x) => {
          const valores: Record<string, unknown> = { ...x };
          if (x.hora_salida) valores['hora_salida'] = x.hora_salida.slice(0, 5);
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
    const datos = this.form.getRawValue() as unknown as Partial<Evaluacion>;
    const peticion = this.id()
      ? this.api.actualizar(Number(this.id()), datos)
      : this.api.crear(datos);
    this.guardando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: async (x) => {
        this.guardando.set(false);
        await (await this.toast.create({ message: 'Guardado.', color: 'success', duration: 2000 })).present();
        void this.router.navigate(['/evaluaciones', x.id], { replaceUrl: true });
      },
      error: (e) => {
        this.guardando.set(false);
        // Muestra los errores de validación que devuelve Django (400).
        this.error.set(mensajeError(e));
      },
    });
  }
}
