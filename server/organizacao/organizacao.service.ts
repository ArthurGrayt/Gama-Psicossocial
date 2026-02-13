import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OrganizacaoService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
        );
    }

    async findAllUnidades() {
        const { data, error } = await this.supabase.from('unidades').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllSetores() {
        const { data, error } = await this.supabase.from('setor').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllCargos() {
        const { data, error } = await this.supabase.from('cargos').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllCargoSetor() {
        const { data, error } = await this.supabase.from('cargo_setor').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
