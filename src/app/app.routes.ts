import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ErrorComponent } from './components/error/error.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { GenerarUsuarioComponent } from './components/generar-usuario/generar-usuario.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { Component } from '@angular/core';
import { DisponibilidadComponent } from './components/disponibilidad/disponibilidad.component';
import { SolicitarTurnoComponent } from './components/solicitar-turno/solicitar-turno.component';
import { TurnosComponent } from './components/turnos/turnos.component';
import { MisTurnosComponent } from './components/mis-turnos/mis-turnos.component';
import { EspecialidadesComponent } from './components/especialidades/especialidades.component';
import { AgregarEspecialidadComponent } from './components/agregar-especialidad/agregar-especialidad.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { HistoriasClinicasComponent } from './components/historias-clinicas/historias-clinicas.component';
import { CargarHistoriaClinicaComponent } from './components/cargar-historia-clinica/cargar-historia-clinica.component';

export const routes: Routes = [

    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'bienvenida',
    },
    {
        path: 'bienvenida',
        component: BienvenidaComponent,
    },
    {
        path: 'home',
        component: HomeComponent,
        children:[
            {   path: 'usuarios',
                component: UsuariosComponent,
            },
            {   path: 'usuarios/historias-clinicas',
                component: HistoriasClinicasComponent,
            },
            {   path: 'especialidades',
                component: EspecialidadesComponent,
            },
            {
                path: 'generar-usuario',
                component: GenerarUsuarioComponent,
            },
            {
                path: 'perfil',
                component: PerfilComponent,
            },                
            {
                path: 'perfil/disponibilidad',
                component: DisponibilidadComponent
            },
            {   path: 'perfil/agregar-especialidad',
                component: AgregarEspecialidadComponent,
            }, 
            {
                path: 'solicitar-turno',
                component: SolicitarTurnoComponent,
            },
            {
                path: 'turnos',
                component: TurnosComponent,
            },
            {
                path: 'mis-turnos',
                component: MisTurnosComponent,
            },
            {
                path: 'mis-turnos/cargar-historia-clinica',
                component: CargarHistoriaClinicaComponent,
            },
            {
                path: 'pacientes',
                component: PacientesComponent,
            },
            {
                path: 'pacientes/historias-clinicas',
                component: HistoriasClinicasComponent,
            },
        ]
    },
    {   path: 'login',
        component: LoginComponent,
    },
    {
        path: 'register',
        component: RegisterComponent,
    },
    {
        path: '**',
        component: ErrorComponent,
    }

];
