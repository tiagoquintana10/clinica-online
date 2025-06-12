import { Component } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.prod';
import { FormsModule } from '@angular/forms';
import { RouterLink,Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  mail: string = "";
  password: string = "";

  constructor(private router : Router){
    this.loadRegisteredEmails();
  } 
  
  submitted: boolean = false;
  incorrect: boolean = false;
  errorMsg : string = '';

  registeredEmails: string[] = [];
  filteredEmails: string[] = [];
  showSuggestions = false;

  login(){
    this.submitted = true;
    this.errorMsg = '';
    
    if(this.mail.length == 0 ||
      this.password.length == 0)
    {
      this.errorMsg = 'Credenciales incorrectas';  
      return;
    }
    supabase.auth.signInWithPassword({
      email: this.mail,
      password: this.password,
    }).then(({data, error}) => {
      if(error){
        this.incorrect = true;
        if (error.message === 'Email not confirmed'){
          this.errorMsg = 'Verifica tu email para poder iniciar sesion'; 
        }else{
          this.errorMsg = 'Credenciales incorrectas';  
        }
        console.error('Error:', error.message)
      }else{
        this.router.navigate(['home']);
      }
    });

  }

  loadRegisteredEmails() {
    supabase
      .from('usuarios')
      .select('email')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando emails:', error.message);
          return;
        }
        this.registeredEmails = (data || [])
          .map((item: any) => item.email)
          .filter((email: string) => !!email);
      });
  } 

  selectEmail(selectedEmail: string) {
    this.mail = selectedEmail;
    this.password = '';
    this.showSuggestions = false;
  }
  
  inputEmail() {
    this.filteredEmails = this.registeredEmails.filter(email =>
      email.toLowerCase().includes(this.mail.toLowerCase())
    );
    this.showSuggestions = this.filteredEmails.length > 0;
}

  esconderSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

}
