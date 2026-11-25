import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText, IonTitle, IonToggle, IonToolbar, ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/crud-api';
import { Consentimiento, Corredor } from '../../core/modelos';
import { ConsentimientosApi, CorredoresApi } from '../../core/runcty-api.service';

/** Formulario para crear (/consentimientos/nuevo) o editar (/consentimientos/:id/editar) un(a) consentimiento. */
@Component({
  selector: 'app-consentimientos-form',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonText, IonTitle, IonToggle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/consentimientos"></ion-back-button></ion-buttons>
        <ion-title>{{ id() ? 'Editar' : 'Nuevo' }} consentimiento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item><ion-select label="Corredor" labelPlacement="stacked" interface="popover" formControlName="corredor" placeholder="Selecciona">
            @for (o of opcionesCorredor(); track o.id) { <ion-select-option [value]="o.id">{{ o.alias }}</ion-select-option> }
          </ion-select></ion-item>
          <ion-item><ion-input label="Versión" labelPlacement="stacked" type="text" formControlName="version"></ion-input></ion-item>
          <ion-item><ion-toggle formControlName="aceptado">Acepto participar y el tratamiento de mis datos</ion-toggle></ion-item>
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
export class ConsentimientosFormPage implements OnInit {
  /** :id cuando se edita; vacío cuando se crea. */
  readonly id = input<string>();

  private readonly api = inject(ConsentimientosApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly opcionesCorredor = signal<Corredor[]>([]);
  

  protected readonly form = new FormGroup({
    corredor: new FormControl<number | null>(null, { validators: [Validators.required] }),
    version: new FormControl<string>('1.0-demo', { nonNullable: true, validators: [Validators.required] }),
    aceptado: new FormControl<boolean>(true, { nonNullable: true, validators: [] }),
  });

  constructor() {
    inject(CorredoresApi).listar().subscribe((l) => this.opcionesCorredor.set(l));
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
    const datos = this.form.getRawValue() as unknown as Partial<Consentimiento>;
    const peticion = this.id()
      ? this.api.actualizar(Number(this.id()), datos)
      : this.api.crear(datos);
    this.guardando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: async (x) => {
        this.guardando.set(false);
        await (await this.toast.create({ message: 'Guardado.', color: 'success', duration: 2000 })).present();
        void this.router.navigate(['/consentimientos', x.id], { replaceUrl: true });
      },
      error: (e) => {
        this.guardando.set(false);
        // Muestra los errores de validación que devuelve Django (400).
        this.error.set(mensajeError(e));
      },
    });
  }
}
