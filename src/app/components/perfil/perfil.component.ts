import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { Usuario } from '../../models/usuario';
import { Turno } from '../../models/turnos';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MisTurnosComponent } from '../mis-turnos/mis-turnos.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-perfil',
  imports: [CommonModule,FormsModule,RouterLink],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit{

  usuario: Usuario | null = null;

  diasDeSemana: string[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes','Sabado'];
  disponibilidad: { dia: string, horas: [string, string] }[] = [];

  disponibilidadEditable: { dia: string, hora_inicio: string, hora_fin: string }[] = [];

  especialidadesDisponibles: string[] = [];

  constructor(private router: Router){}

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

        if (this.usuario?.categoria === 'especialista') {
          this.loadDisponibilidad();
          this.loadEspecialidades();
        }
      })
      
    });
  }

  getAvatarUrl(avatarUrl: string) {
    return supabase.storage.from('images').getPublicUrl(avatarUrl).data.publicUrl;
  }

  loadDisponibilidad() {
    if (!this.usuario?.id) {
      console.error('No hay usuario cargado');
      return;
    }

    supabase
      .from('disponibilidad')
      .select('*')
      .eq('especialista_id', this.usuario.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error al cargar disponibilidad:', error.message);
          return;
        }

        if (data && data.length > 0) {
          this.disponibilidad = data
            .filter(item => item.hora_inicio && item.hora_fin) 
            .sort((a, b) => this.diasDeSemana.indexOf(a.dia) - this.diasDeSemana.indexOf(b.dia)) // ordenamos por día
            .map(item => ({
              dia: item.dia,
              horas: [item.hora_inicio, item.hora_fin]as [string, string]
            }));
        } else {
          this.disponibilidad = [];
          console.log('El especialista aún no cargó disponibilidad.');
        }
      });
  }

  loadEspecialidades(){
    const idsEspecialidades = this.usuario?.especialidades || [];

    if (idsEspecialidades.length === 0) return;
    
    supabase
      .from('especialidades')
      .select('id, nombre')
      .in('id', idsEspecialidades)               
      .eq('habilitado', true)                    
      .then(({ data, error }) => {
        if (error) {
          console.error('Error obteniendo especialidades:', error.message);
          return;
        }

        this.especialidadesDisponibles = (data|| []).map(e => e.nombre); 
        console.log(this.especialidadesDisponibles);
      });  
  }

}
