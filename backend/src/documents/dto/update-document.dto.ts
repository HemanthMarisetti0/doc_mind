import { IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /** Pass null to remove the document from its collection. */
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  collectionId?: string | null;
}
