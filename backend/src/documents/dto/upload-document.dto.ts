import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;
}
