import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, CommonModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
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

  
}
