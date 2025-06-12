import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
import { createClient } from '@supabase/supabase-js';
import { Usuario } from '../../models/usuario';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit{
  
  constructor(private router : Router){}

  ngOnInit() {
    this.getUsersData();
  }

  usuarios: Usuario [] = [];

  //trae todos los usuarios a excepcion del logueado
  getUsersData(){
  supabase.auth.getUser().then(({data,error}) => {
    if(error){
      console.error('Error:',error.message);
      return;
    }        
    const adminId = data.user.id;

    supabase.from('usuarios').select('*').neq('id', adminId).then(({data,error}) => {
      if(error){
        console.error('Error al obtener usuarios:', error.message);
        return;
      }  
      console.log('Usuarios:', data);
      this.usuarios = data;  
    });
  });
}

actualizarEstado(usuario: Usuario) {
  const nuevoEstado = !usuario.habilitado;

  supabase.from('usuarios')
    .update({ habilitado: nuevoEstado })
    .eq('id', usuario.id)
    .then(({ data, error }) => {
      if (error) {
        console.error('Error al actualizar estado:', error.message);
        return;
      }

      usuario.habilitado = nuevoEstado;
    });
}

}
