import { Module } from '@nestjs/common';
import { ClientesModule } from './clientes/clientes.module';
import { OrganizacaoModule } from './organizacao/organizacao.module';
import { FormsModule } from './forms/forms.module';
import { UsersModule } from './users/users.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { SistemaModule } from './sistema/sistema.module';

@Module({
    imports: [
        ClientesModule,
        OrganizacaoModule,
        FormsModule,
        UsersModule,
        FinanceiroModule,
        SistemaModule
    ],
})
export class AppModule { }
