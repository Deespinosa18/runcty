import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/crud-api';
import { Ruta, Zona, DIFICULTADES, SUPERFICIES } from '../../core/modelos';
import { RutasApi, ZonasApi } from '../../core/runcty-api.service';

/** Formulario para crear (/rutas/nuevo) o editar (/rutas/:id/editar) un(a) ruta. */
@Component({
  selector: 'app-rutas-form',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/rutas"></ion-back-button></ion-buttons>
        <ion-title>{{ id() ? 'Editar' : 'Nuevo' }} ruta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item><ion-select label="Zona" labelPlacement="stacked" interface="popover" formControlName="zona" placeholder="Selecciona">
            @for (o of opcionesZona(); track o.id) { <ion-select-option [value]="o.id">{{ o.nombre }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-input label="Nombre" labelPlacement="stacked" type="text" formControlName="nombre"></ion-input></ion-item>
          <ion-item><ion-input label="Distancia (km)" labelPlacement="stacked" type="number" formControlName="km"></ion-input></ion-item>
          <ion-item><ion-input label="Desnivel (m)" labelPlacement="stacked" type="number" formControlName="desnivel"></ion-input></ion-item>
          <ion-item><ion-select label="Superficie" labelPlacement="stacked" interface="popover" formControlName="superficie">
            @for (op of superficies; track op[0]) { <ion-select-option [value]="op[0]">{{ op[1] }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-select label="Dificultad" labelPlacement="stacked" interface="popover" formControlName="dificultad">
            @for (op of dificultades; track op[0]) { <ion-select-option [value]="op[0]">{{ op[1] }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-input label="Iluminación (0-100)" labelPlacement="stacked" type="number" formControlName="iluminacion"></ion-input></ion-item>
          <ion-item><ion-input label="Afluencia de personas (0-100)" labelPlacement="stacked" type="number" formControlName="afluencia"></ion-input></ion-item>
          <ion-item><ion-input label="Puntos de apoyo (0-100)" labelPlacement="stacked" type="number" formControlName="apoyo"></ion-input></ion-item>
          <ion-item><ion-input label="Incidentes históricos" labelPlacement="stacked" type="number" formControlName="incidentes_base"></ion-input></ion-item>
        </ion-list>

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
export class RutasFormPage implements OnInit {
  /** :id cuando se edita; vacío cuando se crea. */
  readonly id = input<string>();

  private readonly api = inject(RutasApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly opcionesZona = signal<Zona[]>([]);
  protected readonly dificultades = Object.entries(DIFICULTADES);
  protected readonly superficies = Object.entries(SUPERFICIES);

  protected readonly form = new FormGroup({
    zona: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nombre: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    km: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.1)] }),
    desnivel: new FormControl<number | null>(0, { validators: [Validators.min(0)] }),
    superficie: new FormControl<string>('PAVIMENTO', { nonNullable: true, validators: [] }),
    dificultad: new FormControl<string>('MEDIA', { nonNullable: true, validators: [] }),
    iluminacion: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    afluencia: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    apoyo: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    incidentes_base: new FormControl<number | null>(0, { validators: [Validators.min(0)] }),
  });

  constructor() {
    inject(ZonasApi).listar().subscribe((l) => this.opcionesZona.set(l));
  }

  ngOnInit(): void {
    if (this.id()) {
      this.api.obtener(Number(this.id())).subscribe({
        next: (x) => {
          const valores: Record<string, unknown> = { ...x };
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
    const datos = this.form.getRawValue() as unknown as Partial<Ruta>;
    const peticion = this.id()
      ? this.api.actualizar(Number(this.id()), datos)
      : this.api.crear(datos);
    this.guardando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: async (x) => {
        this.guardando.set(false);
        await (await this.toast.create({ message: 'Guardado.', color: 'success', duration: 2000 })).present();
        void this.router.navigate(['/rutas', x.id], { replaceUrl: true });
      },
      error: (e) => {
        this.guardando.set(false);
        // Muestra los errores de validación que devuelve Django (400).
        this.error.set(mensajeError(e));
      },
    });
  }
}
