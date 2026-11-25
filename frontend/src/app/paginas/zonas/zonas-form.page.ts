import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonText, IonTextarea, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';

import { mensajeError } from '../../core/crud-api';
import { Zona } from '../../core/modelos';
import { ZonasApi } from '../../core/runcty-api.service';

/** Formulario para crear (/zonas/nuevo) o editar (/zonas/:id/editar) un(a) zona. */
@Component({
  selector: 'app-zonas-form',
  imports: [ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonText, IonTextarea, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/zonas"></ion-back-button></ion-buttons>
        <ion-title>{{ id() ? 'Editar' : 'Nuevo' }} zona</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <ion-list>
          <ion-item><ion-input label="Nombre" labelPlacement="stacked" type="text" formControlName="nombre" placeholder="Ej.: Jipiro"></ion-input></ion-item>
          <ion-item><ion-textarea label="Descripción" labelPlacement="stacked" formControlName="descripcion" [autoGrow]="true"></ion-textarea></ion-item>
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
export class ZonasFormPage implements OnInit {
  /** :id cuando se edita; vacío cuando se crea. */
  readonly id = input<string>();

  private readonly api = inject(ZonasApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  
  

  protected readonly form = new FormGroup({
    nombre: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl<string>('', { nonNullable: true, validators: [] }),
  });

  constructor() {
    
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
    const datos = this.form.getRawValue() as unknown as Partial<Zona>;
    const peticion = this.id()
      ? this.api.actualizar(Number(this.id()), datos)
      : this.api.crear(datos);
    this.guardando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: async (x) => {
        this.guardando.set(false);
        await (await this.toast.create({ message: 'Guardado.', color: 'success', duration: 2000 })).present();
        void this.router.navigate(['/zonas', x.id], { replaceUrl: true });
      },
      error: (e) => {
        this.guardando.set(false);
        // Muestra los errores de validación que devuelve Django (400).
        this.error.set(mensajeError(e));
      },
    });
  }
}
