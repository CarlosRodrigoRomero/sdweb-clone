import { FormGroup } from '@angular/forms';

export class CustomValidators {
  static match(firstControlName, secondControlName, customError = 'mismatch') {
    return (fg: FormGroup) => {
      return fg.get(firstControlName).value === fg.get(secondControlName).value ? null : { [customError]: true };
    };
  }
}
