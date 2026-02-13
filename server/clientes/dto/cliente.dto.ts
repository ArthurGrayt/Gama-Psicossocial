import { ApiProperty } from '@nestjs/swagger';

export class ClienteDto {
  @ApiProperty({ example: 1, description: 'ID do cliente' })
  id: number;

  @ApiProperty({ example: 'Razão Social LTDA', description: 'Razão Social da empresa' })
  razao_social: string;

  @ApiProperty({ example: 'Nome Fantasia', description: 'Nome Fantasia da empresa' })
  nome_fantasia: string;

  @ApiProperty({ example: '00.000.000/0001-00', description: 'CNPJ da empresa' })
  cnpj: string;

  @ApiProperty({ example: 'contato@empresa.com', description: 'Email de contato' })
  email: string;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone de contato' })
  telefone: string;

  @ApiProperty({ example: 'Rua Exemplo, 123', description: 'Endereço da empresa' })
  endereco: string;

  @ApiProperty({ example: 'ativo', description: 'Status do cliente' })
  status: string;

  @ApiProperty({ example: 'Responsável', description: 'Nome do responsável' })
  responsavel: string;

  @ApiProperty({ example: 'https://exemplo.com/logo.png', description: 'URL da imagem/logo' })
  img_url: string;

  @ApiProperty({ example: 'uuid-do-responsavel', description: 'ID do usuário responsável' })
  empresa_responsavel: string;

  @ApiProperty({ example: 'uuid-do-cliente', description: 'UUID único do cliente' })
  cliente_uuid: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Data de criação' })
  created_at: string;
}
