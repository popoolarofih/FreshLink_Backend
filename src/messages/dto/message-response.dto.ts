import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageSenderDto {
  @ApiProperty() id: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional({ nullable: true }) avatarUrl: string | null;
}

export class MessageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderId: string;
  @ApiProperty() senderId: string;
  @ApiProperty({ type: () => MessageSenderDto }) sender: MessageSenderDto;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional({
    nullable: true,
    description: 'null until the recipient reads the thread',
  })
  readAt: Date | null;
}

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] }) data: MessageResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
