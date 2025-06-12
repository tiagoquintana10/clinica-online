import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
import { createClient } from '@supabase/supabase-js';
import { Usuario } from '../../models/usuario';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-generar-usuario',
  imports: [CommonModule,FormsModule,RouterLink],
  templateUrl: './generar-usuario.component.html',
  styleUrl: './generar-usuario.component.scss'
})
export class GenerarUsuarioComponent {

    
  usuario: Usuario = {
      nombre: '',
      apellido: '',
      edad: 0,
      dni: '',
      obra_social: '',
      categoria: 'paciente',
      url_img1: '',
      url_img2: '',
      especialidades: [],
      habilitado: true,
      email:''
  };

  especialidadesDisponibles: string[] = ['Alergia','Pediatria','Cardiologia','Traumatologia','Psiquiatria'];
  
  password: string = '';
  avatarFile: File | null = null;
  avatarFile2: File | null = null;

  msg = '';
  errorMsg = '';
  submitted = false;

  nuevaEspecialidad: string = '';
  especialidadSeleccionada: string = '';

  constructor(private router: Router) {}

  registrar() {
    this.submitted = true;
    this.errorMsg = '';
    this.msg = '';

    const u = this.usuario;

    // para pacientes y datos comunes
    if (!u.email || !this.password || !u.nombre || !u.apellido || !u.dni || !u.edad || !this.avatarFile || u.categoria === 'paciente' && (!this.avatarFile2 || !u.obra_social)) {
      this.errorMsg = 'Por favor completá todos los campos obligatorios.';
      return;
    }

    // para especialistas
    if (u.categoria === 'especialista' && (!u.especialidades || u.especialidades.length === 0 || !this.avatarFile || !u.obra_social)) {
      this.errorMsg = 'Por favor completá todos los campos obligatorios.';
      return;
    }

    supabase.auth.signUp({
      email: u.email,
      password: this.password,
    }).then(({ data, error }) => {
      if (error) {
        console.error(error.message);
        this.errorMsg = 'Error al registrarse: ' + error.message;
      } else {
        console.log('usuario registrado con exito', data.user);
        
        this.saveUserData(data.user);

      }
    });
  }

  saveUserData(user: any) {
    if (!user) {
      this.errorMsg = 'Error interno: usuario no válido.';
      return;
    }

    this.saveFile().then((data1) => {
      if (data1) {
        this.usuario.url_img1 = data1.path;

        if (this.usuario.categoria === 'paciente' && this.avatarFile2) {
          const original = this.avatarFile;
          this.avatarFile = this.avatarFile2;

          this.saveFile().then((data2) => {
            if (data2) {
              this.usuario.url_img2 = data2.path;
            }

            this.avatarFile = original;

            this.insertUser(user);
          });
        } else {
          this.insertUser(user);
        }
      }
    });
  }

  insertUser(user: Usuario) {
    supabase.from('usuarios').insert([
      {
        id: user.id,
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        edad: this.usuario.edad,
        dni: this.usuario.dni,
        obra_social: this.usuario.obra_social,
        categoria: this.usuario.categoria,
        especialidades: this.usuario.especialidades,
        habilitado: this.usuario.habilitado,
        url_img1: this.usuario.url_img1,
        url_img2: this.usuario.url_img2,
        email: this.usuario.email
      }
    ]).then(({ data, error }) => {
      if (error) {
        console.error('Error:', error.message);
      } else {
        this.msg = '¡Usuario creado con exito!';
        this.usuario = {
          nombre: '',
          apellido: '',
          edad: 0,
          dni: '',
          obra_social: '',
          categoria: 'paciente',
          url_img1: '',
          url_img2: '',
          especialidades: [],
          habilitado: true,
          email: ''
        };

        this.password = '';
        this.avatarFile = null;
        this.avatarFile2 = null;
        this.nuevaEspecialidad = '';
        this.especialidadSeleccionada = '';
        this.submitted = false;
      }
    });
  }  

  async saveFile() {
  const { data, error } = await supabase
    .storage
    .from('images')
    .upload(`users/${this.avatarFile?.name}`, this.avatarFile!, {
      cacheControl: '3600',
      upsert: false
    });

    return data;
  }

  onFileSelected(event: any) {
    this.avatarFile = event.target.files[0];
  }
  
  onFileSelected2(event: any) {
    this.avatarFile2 = event.target.files[0];
  }

  agregarEspecialidad() {
    const nueva = this.nuevaEspecialidad.trim();
    if (nueva) {
      this.usuario.especialidades = [nueva]; 
      this.nuevaEspecialidad = '';
    }
  }

  EspecialidadChange() {
    if (this.especialidadSeleccionada !== 'Otro') {
      this.usuario.especialidades = [this.especialidadSeleccionada];
    } else {
      this.usuario.especialidades = [];
    }
  }
}

