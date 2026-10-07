import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Leave both ids empty to chat with all documents. */
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
