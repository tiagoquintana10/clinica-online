import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ErrorComponent } from './components/error/error.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { GenerarUsuarioComponent } from './components/generar-usuario/generar-usuario.component';

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
            {
                path: 'generar-usuario',
                component: GenerarUsuarioComponent,
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
