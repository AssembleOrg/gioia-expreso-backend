import { PartialType } from '@nestjs/swagger';
import { CreateDepositReceiptDto } from './create-depositReceipt.dto';

export class UpdateDepositReceiptDto extends PartialType(CreateDepositReceiptDto) { }
