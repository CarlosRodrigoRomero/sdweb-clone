import { Component, OnInit } from '@angular/core';
import { UserInterface } from '@core/models/user';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
})
export class VerifyEmailComponent implements OnInit {
  user: UserInterface;

  constructor(public authService: AuthService) {
    this.authService.user$.subscribe((data) => (this.user = data));
  }

  ngOnInit(): void {}
}
