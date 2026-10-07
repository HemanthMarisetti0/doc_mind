import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListDocumentsDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsIn(['UPLOADED', 'PROCESSING', 'READY', 'FAILED'])
  status?: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
