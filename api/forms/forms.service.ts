import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class FormsService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
        );
    }

    async findAllForms() {
        const { data, error } = await this.supabase.from('forms').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllQuestions() {
        const { data, error } = await this.supabase.from('form_questions').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllAnswers() {
        const { data, error } = await this.supabase.from('form_answers').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllDimensions() {
        const { data, error } = await this.supabase.from('form_hse_dimensions').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAllRules() {
        const { data, error } = await this.supabase.from('form_hse_rules').select('*');
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }
}
