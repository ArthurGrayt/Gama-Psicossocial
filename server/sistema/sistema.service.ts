import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SistemaService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
        );
    }

    async findAllWebhookLogs() {
        const { data, error } = await this.supabase.from('webhook_logs').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
