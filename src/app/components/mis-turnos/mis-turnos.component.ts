import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Turno } from '../../models/turnos';
import { environment } from '../../../environments/environment.prod';
import { createClient } from '@supabase/supabase-js';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.scss'
})
export class MisTurnosComponent implements OnInit {

  usuario: Usuario | null = null;
  turnos: any[] = [];


    
  constructor(private router : Router){}

  ngOnInit(): void {
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

  loadTurnos() {
    if (!this.usuario?.id) return;

    supabase
      .from('turnos')
      .select(`
        *,
        paciente:paciente_id ( nombre, apellido ),
        especialista:especialista_id ( nombre, apellido )
      `)
      .or(`paciente_id.eq.${this.usuario.id},especialista_id.eq.${this.usuario.id}`)
      .order('fecha', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando turnos:', error.message);
          this.turnos = [];
          return;
        }
        this.turnos = (data as any[]).map(t => ({
          ...t,
          paciente: t.paciente || { nombre: 'Paciente', apellido: '' },
          especialista: t.especialista || { nombre: 'Especialista', apellido: '' },
        }));
      });
  }


}



