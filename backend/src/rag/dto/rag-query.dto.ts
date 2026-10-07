import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
