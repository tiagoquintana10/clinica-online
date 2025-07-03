import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { trigger, transition, style, animate, query, animateChild, group, state, keyframes } from '@angular/animations';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, CommonModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations:[
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ top: '100%', opacity: 0 })
        ], { optional: true }),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [
            animate('3000ms ease-out', style({ top: '100%', opacity: 0 }))
          ], { optional: true }),
          query(':enter', [
            animate('1500ms ease-out', style({ top: '0%', opacity: 1 }))
          ], { optional: true })
        ]),
        query(':enter', animateChild(), { optional: true }),
      ])
    ])
  ]
})

export class HomeComponent implements OnInit{

  rutaActual: string = '';
  usuario: Usuario | null = null;

  constructor(private router : Router){}

  ngOnInit() {
    this.rutaActual = this.router.url;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActual = event.url;
    });
  
    this.getUserData();
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }


  getUserData(){
    supabase.auth.getUser().then(({data,error}) => {
      if(error){
        console.error('Error:',error.message);
        return;
      }        
      const userId = data.user.id;
      supabase.from('usuarios').select('*').eq('id',userId).single().then(({data,error}) => {
        
      if(error){
        console.error('Error al obtener usuario:', error.message);
        return;
      }  
      console.log('Data:',data);
      this.usuario = data; 
      })
      
    });
  }

  getAvatarUrl(avatarUrl: string) {
    return supabase.storage.from('images').getPublicUrl(avatarUrl).data.publicUrl;
  }

  

  logout(){
    supabase.auth.signOut();
    this.router.navigate(['/login']);
  }

  mostrarDatos(): boolean {
    const url = this.router.url;
    return url === '/home';
  }

  esAdmin(): boolean {
    return this.usuario?.categoria === 'administrador';
  }

  esEspecialista(): boolean {
    return this.usuario?.categoria === 'especialista';
  }

  esPaciente(): boolean {
    return this.usuario?.categoria === 'paciente';
  }

  cuentaHabilitada(): boolean{
    return this.usuario?.habilitado === true;
  }
  
}
