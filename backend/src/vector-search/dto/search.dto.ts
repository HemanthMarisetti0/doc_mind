import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  query: string;

  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;
}
