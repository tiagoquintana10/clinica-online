import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Turno } from '../../models/turnos';
import { environment } from '../../../environments/environment.prod';
import { createClient } from '@supabase/supabase-js';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockLocationStrategy } from '@angular/common/testing';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterLink],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.scss'
})
export class MisTurnosComponent implements OnInit {

  usuario: Usuario | null = null;
  turnos: any[] = [];

  comentariosEspecialista: Record<string, string> = {};
  comentariosPaciente: Record<string, string> = {};
  puntajeSeleccionado: { [Id: string]: string } = {}; 
  resenasVisibles: { [id: string]: boolean } = {};
  encuestaVisible: { [id: string]: boolean } = {};
  calificacionVisible: { [id: string]: boolean } = {};  
  msgError:{ [key: string] : string } = {};

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

      this.loadTurnos();
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


  cancelarTurno(turnoId: string, motivo: string) {
    if (!motivo || motivo.trim() === '') {
      this.msgError[turnoId] = 'Debes ingresar un comentario para cancelar el turno';
      return;
    }

    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ estado: 'cancelado', comentario: motivo })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al cancelar turno:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }

  
  verResena(turno: any){
    this.resenasVisibles[turno.id] = !this.resenasVisibles[turno.id];
  }

  verEncuesta(turno: any) {
    this.encuestaVisible[turno.id] = !this.encuestaVisible[turno.id];
  }

  verCalificacion(turno: any) {
    this.calificacionVisible[turno.id] = !this.calificacionVisible[turno.id];
  }

  
  completarEncuesta(turnoId: string, encuesta: string) {
    if (!encuesta || encuesta.trim() === '') {
      this.msgError[turnoId] = 'Debe ingresar un comentario para completar la encuesta';
      return;
    }

    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ encuesta: encuesta })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al completar encuesta:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }

  calificarAtencion(turnoId: string, puntaje: string) {
    this.puntajeSeleccionado[turnoId] = puntaje; 
  }

  enviarCalificacion(turnoId: string) {
    const puntaje = this.puntajeSeleccionado[turnoId];
    if (!puntaje || !/^[1-9]$|^10$/.test(puntaje.trim())) {
      this.msgError[turnoId] = 'Debe calificar la atención del 1 al 10';
      return;
    }

    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ calificacion: puntaje })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al calificar atención:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }
  
  
  rechazarTurno(turnoId: string, motivo: string) {
    if (!motivo || motivo.trim() === '') {
      this.msgError[turnoId] = 'Debe ingresar un comentario para rechazar el turno';
      return;
    }

    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ estado: 'rechazado', comentario: motivo })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al rechazar turno:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }

  
  aceptarTurno(turnoId: string) {
    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ estado: 'aceptado' })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al aceptar turno:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }

  
  finalizarTurno(turnoId: string, resena: string) {
    if (!resena || resena.trim() === '') {
      this.msgError[turnoId] = 'Debe ingresar una reseña para finalizar el turno';
      return;
    }

    this.msgError[turnoId] = '';
    supabase
      .from('turnos')
      .update({ estado: 'realizado', reseña: resena })
      .eq('id', turnoId)
      .then(({ error }) => {
        if (error) {
          console.error('Error al finalizar turno:', error.message);
        } else {
          this.loadTurnos();
        }
      });
  }



}



