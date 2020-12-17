import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';

import { AdminService } from '@core/services/admin.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css'],
})
export class EditUserComponent implements OnInit {
  form: FormGroup;
  emailVerified: boolean;
  id: string;
  user: UserInterface;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private adminService: AdminService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.id = params.id;
    });
    this.adminService.getAllUsers().subscribe((users) => {
      users.filter((user) => {
        if (user.uid === this.id) {
          this.user = user;
          this.form.patchValue({ email: user.email, empresa: user.empresaNombre });
        }
      });
    });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
      role: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      const user = this.form.value;
      console.log(user);
      console.log(this.user);
    }
  }
}
