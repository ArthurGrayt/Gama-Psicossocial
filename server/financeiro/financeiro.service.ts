import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class FinanceiroService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
        );
    }

    async findAllPayments() {
        const { data, error } = await this.supabase.from('payment_history').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
