import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    if (!password) {
      return false;
    }

    // Al menos 8 caracteres
    if (password.length < 8) {
      return false;
    }

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Al menos un número
    if (!/[0-9]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}


