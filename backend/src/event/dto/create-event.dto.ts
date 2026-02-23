import { IsString, IsDateString, IsInt, Min, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsDateString()
  date!: string; // ISO 8601 format

  @IsString()
  @MaxLength(200)
  location!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}
