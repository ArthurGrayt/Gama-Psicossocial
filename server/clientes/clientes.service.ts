import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
        );
    }

    async findAll(): Promise<ClienteDto[]> {
        const { data, error } = await this.supabase
            .from('clientes')
            .select('*');

        if (error) {
            throw new InternalServerErrorException(error.message);
        }

        return data as ClienteDto[];
    }
}
