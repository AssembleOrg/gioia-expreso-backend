import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidBultoPeso', async: false })
export class IsValidBultoPesoConstraint implements ValidatorConstraintInterface {
  validate(peso: number, args: ValidationArguments) {
    const object = args.object as any;
    const x = object.x;
    const y = object.y;
    const z = object.z;

    // Si todas las dimensiones son 0, el peso puede ser 0 (paquete predefinido)
    if (x === 0 && y === 0 && z === 0) {
      return peso >= 0;
    }

    // Si hay dimensiones > 0, el peso debe ser > 0 (bulto personalizado)
    return peso > 0;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const x = object.x;
    const y = object.y;
    const z = object.z;

    if (x === 0 && y === 0 && z === 0) {
      return 'El peso debe ser mayor o igual a 0 cuando las dimensiones son 0 (paquete predefinido)';
    }

    return 'El peso debe ser mayor a 0 cuando se especifican dimensiones (bulto personalizado)';
  }
}

export function IsValidBultoPeso(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidBultoPesoConstraint,
    });
  };
}

