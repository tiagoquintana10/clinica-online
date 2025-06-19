import { Component, OnInit } from '@angular/core';
import { Router,RouterModule } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { Usuario } from '../../models/usuario';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  standalone:true,
  imports: [FormsModule,CommonModule,RouterModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit{

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

  especialidadesDisponibles: {id:string; nombre:string}[] = [];
  
  password: string = '';
  avatarFile: File | null = null;
  avatarFile2: File | null = null;

  errorMsg = '';
  submitted = false;

  nuevaEspecialidad: string = '';
  especialidadSeleccionada: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadEspecialidades();    
  }

  registrar() {
    this.submitted = true;
    this.errorMsg = '';

    const u = this.usuario;

    // para pacientes y datos comunes
    if (!u.email || !this.password || !u.nombre || !u.apellido || !u.dni || !u.edad || !this.avatarFile || !u.obra_social || (u.categoria === 'paciente' && !this.avatarFile2)) {
      this.errorMsg = 'Por favor completá todos los campos obligatorios.';
      return;
    }

    //para especialistas y agregar especialidad
    if (this.especialidadSeleccionada === 'Otro' && this.nuevaEspecialidad.trim() !== '') {
      supabase
        .from('especialidades')
        .insert([{ nombre: this.nuevaEspecialidad.trim(), habilitado: false }])
        .select('id')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error agregando nueva especialidad:', error.message);
            this.errorMsg = 'No se pudo agregar la nueva especialidad. Intente más tarde.';
            return;
          }
          u.especialidades = [data.id];
          // hay q validar una vez q ya se agrego la especialidad
          if (u.categoria === 'especialista' && (!u.especialidades || u.especialidades.length === 0 || !this.avatarFile)) {
            this.errorMsg = 'Debés seleccionar al menos una especialidad.';
            return;
          }
          this.continuarRegistro(u);
        });
    } else {
    // si seleccionó una existente
    if (this.especialidadSeleccionada !== 'Otro' && this.especialidadSeleccionada !== '') {
      u.especialidades = [this.especialidadSeleccionada];
    }

    // si hay al menos una seleccionada
    if (u.categoria === 'especialista' && (!u.especialidades || u.especialidades.length === 0 || !u.obra_social)) {
      this.errorMsg = 'Debés seleccionar al menos una especialidad.';
      return;
    }

    this.continuarRegistro(u);
    }
  }

  continuarRegistro(u: Usuario){    
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
    if(this.usuario.categoria === 'especialista'){
      this.usuario.habilitado = false;
    }
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
        this.router.navigate(['login']);
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

  EspecialidadChange() {
    if (this.especialidadSeleccionada !== 'Otro') {
      this.usuario.especialidades = [this.especialidadSeleccionada];
    } else {
      this.usuario.especialidades = [];
    }
  }

  loadEspecialidades(){
    supabase
      .from('especialidades')
      .select('id, nombre')
      .eq('habilitado', true)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando especialidades:', error.message);
          return;
        }
        this.especialidadesDisponibles = data || [];
      });    
  }
}
