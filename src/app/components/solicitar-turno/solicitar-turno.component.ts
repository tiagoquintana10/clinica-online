import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { Turno } from '../../models/turnos';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-solicitar-turno',
  standalone:true,
  imports: [CommonModule,FormsModule],
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.scss'
})
export class SolicitarTurnoComponent implements OnInit{

    usuario: Usuario | null = null;
    turno: Turno = {
      paciente_id: '',
      especialista_id: '',
      especialidad: '',
      fecha: ''
    }as Turno;
    pacientes: Usuario [] = [];
    especialistas: Usuario[] = [];

    especialidadesDisponibles: string[] = [];

    cargaDisponibilidad: boolean = false;
    diasDisponibles: { fecha: string, textoVisible: string }[] = [];          // Días habilitados por el especialista
    horasDisponibles: Record<string, string[]> = {};  
    fechasPosibles: string[] = [];

    diaSeleccionado: string = '';
    horaSeleccionada: string = '';

    sinEspecialistas: boolean = false;
    sinDisponibilidadHoraria: boolean = false;

    constructor(private router : Router){}
  
    ngOnInit(){
      this.getUserData();
      this.loadEspecialidades();
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

          if(this.esAdmin()){
            this.loadPacientes();
          }
        })
        
      });
    }
    
    esAdmin(): boolean {
      return this.usuario?.categoria === 'administrador';
    }

    loadPacientes(){
      if(!this.usuario?.id){
        return;
      }

      supabase
        .from('usuarios')
        .select('id, nombre, apellido, dni')
        .eq('categoria','paciente')                   
        .then(({ data, error }) => {
          if (error) {
            console.error('Error obteniendo pacientes:', error.message);
            return;
          }

          this.pacientes = (data || []) as Usuario []; 
          console.log(this.especialistas);
        });
    }
    
    loadEspecialidades(){
      
      supabase
        .from('especialidades')
        .select('id, nombre')
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

    loadEspecialistas(nombreEspecialidad: string){
      if (!nombreEspecialidad){
        this.especialistas = [];
        this.sinEspecialistas = false;
        return;
      } 

      //  buscamos el id de la especialidad por su nombre en especialidades
      supabase
        .from('especialidades')
        .select('id')
        .eq('nombre', nombreEspecialidad)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.error('Error obteniendo ID de la especialidad:', error?.message);
            return;
          }

          //  buscamos los usuarios de tipo especialistas que tengan ese id en su array de especialidades
          supabase
            .from('usuarios')
            .select('id, nombre, apellido')
            .contains('especialidades', [data.id])
            .eq('categoria', 'especialista')
            .eq('habilitado', true)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error cargando especialistas:', error.message);
                return;
              }

              console.log('Especialistas:', data);
              this.especialistas = data as Usuario[];
              this.sinEspecialistas = this.especialistas.length === 0; 
              this.sinDisponibilidadHoraria = false;
            });
        });
    } 

    loadDisponibilidad(especialistaId :string){
      this.cargaDisponibilidad = true;
      supabase
        .from('disponibilidad')
        .select('dia, hora_inicio, hora_fin')
        .eq('especialista_id', especialistaId)
        .then(({ data, error }) => {
          if (error || !data || data.length === 0) {
            console.error('Error cargando disponibilidad:', error?.message);
            this.diasDisponibles = [];
            this.horasDisponibles = {};
            this.sinDisponibilidadHoraria = true;
            return;
          }

          this.sinDisponibilidadHoraria = false;

          const proximosDias = this.getFechasProximas(15);
          const disponibilidad = data;

          const fechasFiltradas = proximosDias.filter(fecha => { 
            const nombreDia = this.obtenerNombreDia(fecha).toLowerCase().trim();
            const disp = disponibilidad.find(d => d.dia.toLowerCase().trim() === nombreDia);

            if (!disp) return false;

            
            if (!disp.hora_inicio || !disp.hora_fin || disp.hora_inicio === disp.hora_fin) {
              return false;
            }

            return true;  
          });

          if (fechasFiltradas.length === 0) { 
            this.diasDisponibles = [];
            this.horasDisponibles = {};
            this.sinDisponibilidadHoraria = true;
            return;
          }

          const fechasStr = fechasFiltradas.map(f => f.toISOString().split('T')[0]); 


          supabase
            .from('turnos')
            .select('fecha')
            .eq('especialista_id', especialistaId)
            .gte('fecha', fechasStr[0] + 'T00:00:00')
            .lte('fecha', fechasStr[fechasStr.length - 1] + 'T23:59:59')
            .then(({ data: turnos, error: turnosError }) => {
              if (turnosError) {
                console.error('Error obteniendo turnos ocupados:', turnosError.message);
            }

              const horasDisponiblesTemp: Record<string, string[]> = {}; 
              const diasDisponiblesTemp: { fecha: string, textoVisible: string }[] = []; 

              fechasFiltradas.forEach(fecha => { 
                const fechaStr = fecha.toISOString().split('T')[0];
                const nombreDia = this.obtenerNombreDia(fecha).toLowerCase().trim();
                const disp = disponibilidad.find(d => d.dia.toLowerCase().trim() === nombreDia);
                if (!disp) return;

                const ocupados = (turnos || [])
                  .filter(t => {
                    const fechaTurno = new Date(t.fecha);
                    const fechaTurnoStr = fechaTurno.toISOString().split('T')[0];
                    return fechaTurnoStr === fechaStr;
                  })
                  .map(t => {
                    const dt = new Date(t.fecha);
                    const h = dt.getHours().toString().padStart(2, '0');
                    const m = dt.getMinutes().toString().padStart(2, '0');
                    return `${h}:${m}`;
                  });

                const disponibles = this.generarHorarios(disp.hora_inicio, disp.hora_fin, ocupados);

                if (disponibles.length > 0) {
                  diasDisponiblesTemp.push({ 
                    fecha: fechaStr,
                    textoVisible: `${this.obtenerNombreDia(fecha)} (${fecha.toLocaleDateString()})`
                  });
                  horasDisponiblesTemp[fechaStr] = disponibles;
                }
              });
  
              this.diasDisponibles = diasDisponiblesTemp;
              this.horasDisponibles = horasDisponiblesTemp;

              this.diaSeleccionado = '';
              this.horaSeleccionada = '';
              this.cargaDisponibilidad = true;
            });
        });
    }

    generarFechasPosibles() {
      const hoy = new Date();
      this.diasDisponibles = [];

      for (let i = 0; i < 15; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() + i);
        const diaSemana = this.obtenerNombreDia(fecha);

        const visible = this.horasDisponibles[i] ? diaSemana : null;

        if (visible && Object.keys(this.horasDisponibles).length > 0) {
          this.diasDisponibles.push({
            fecha: fecha.toISOString().split('T')[0],
            textoVisible: `${diaSemana} (${fecha.toLocaleDateString()})`
          });
        }
      }
    }

    getHorariosParaDiaSeleccionado(): string[] { 
      return this.horasDisponibles[this.diaSeleccionado] || [];
    }

    obtenerNombreDia(fecha: Date): string {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
      return dias[fecha.getDay()];
    }

    crearTurno() {
      const pacienteId = this.esAdmin() ? this.turno?.paciente_id : this.usuario?.id;

      if (!pacienteId || !this.turno?.especialista_id || !this.turno?.especialidad || !this.diaSeleccionado || !this.horaSeleccionada) {
        console.error('Faltan datos para generar el turno');
        return;
      }

      supabase
        .from('turnos')
        .insert([{
          paciente_id: pacienteId,
          especialista_id: this.turno.especialista_id,
          especialidad: this.turno.especialidad,
          fecha: `${this.diaSeleccionado}T${this.horaSeleccionada}:00`, 
          estado: 'pendiente'
        }])
        .then(({ data, error }) => {
          if (error) {
            console.error('Error al crear turno:', error.message);
            return;
          }
          console.log('Turno creado:', data);
          this.router.navigate(['/home']);
        });
    }

    onEspecialidadChange(nombreEspecialidad: string) {
      this.turno.especialidad = nombreEspecialidad;
      this.turno.especialista_id = '';           
      this.diaSeleccionado = '';                 
      this.horaSeleccionada = '';                
      this.especialistas = [];                   
      this.diasDisponibles = [];                 
      this.horasDisponibles = {};
      this.loadEspecialistas(nombreEspecialidad);
    }

    onEspecialistaChange(especialistaId: string) {
      this.turno.especialista_id = especialistaId;
      this.diaSeleccionado = '';                 
      this.horaSeleccionada = '';                
      this.diasDisponibles = [];                 
      this.horasDisponibles = {};      
      this.loadDisponibilidad(especialistaId);
    }

    onDiaSeleccionadoChange() {
      this.horaSeleccionada = '';
    }

    // genera las proximas n fechas  
    getFechasProximas(n: number): Date[] {
      const fechas = [];
      const hoy = new Date();
      for (let i = 0; i < n; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        fecha.setHours(0,0,0,0);
        fechas.push(fecha);
      }
      return fechas;
    }

    generarHorarios(horaInicio: string, horaFin: string, ocupados: string[]): string[] {
      const horarios: string[] = [];
      let [hora, minuto] = horaInicio.split(':').map(Number);
      const [hFin, mFin] = horaFin.split(':').map(Number);

      while (hora < hFin || (hora === hFin && minuto < mFin)) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        if (!ocupados.includes(horaStr)) {
          horarios.push(horaStr);
        }
        minuto += 30;
        if (minuto >= 60) {
          hora += 1;
          minuto = 0;
        }
      }

      return horarios;
    }
}
