import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Form, FormQuestion, FormAnswer } from '../../types';
// import { jsPDF } from 'jspdf'; // Optional: for export if needed later

interface FormAnalyticsProps {
    form: Form;
    onBack: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const FormAnalytics: React.FC<FormAnalyticsProps> = ({ form, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [answers, setAnswers] = useState<FormAnswer[]>([]);

    useEffect(() => {
        loadData();
    }, [form.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Questions (Global library)
            const { data: qs, error: qError } = await supabase
                .from('form_questions')
                .select('*')
                .order('question_order');

            if (qError) throw qError;
            setQuestions(qs || []);

            // 2. Fetch Answers
            const { data: ans, error: aError } = await supabase
                .from('form_answers')
                .select('*')
                .eq('form_id', form.id);

            if (aError) throw aError;
            setAnswers(ans || []);

        } catch (error) {
            console.error('Error loading analytics:', error);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const getChartData = (q: FormQuestion) => {
        if (!['choice', 'select', 'rating'].includes(q.question_type)) return null;

        const qAnswers = answers.filter(a => a.question_id === q.id);
        const counts: Record<string, number> = {};

        // Initialize with options if available
        if (q.question_type !== 'rating') {
            [1, 2, 3, 4, 5].forEach(i => {
                const opt = (q as any)[`option_${i}`];
                if (opt) counts[opt] = 0;
            });
        }

        qAnswers.forEach(a => {
            const val = a.answer_text || (a.answer_number !== undefined ? String(a.answer_number) : 'N/A');
            counts[val] = (counts[val] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    if (loading) return <div className="p-10 text-center">Carregando dados...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-100px)] flex flex-col">
            <div className="border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg text-slate-800">Resultados: {form.title}</h2>
                        <p className="text-sm text-slate-500">{answers.length} respostas totais</p>
                    </div>
                </div>
                {/* Export Feature Placeholder */}
                <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto">
                {questions.map((q) => {
                    if (q.question_type === 'section_break') return null;
                    const chartData = getChartData(q);

                    return (
                        <div key={q.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-4">{q.label}</h3>

                            {chartData ? (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#35b6cf" radius={[0, 4, 4, 0]}>
                                                {chartData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-slate-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                            <tr>
                                                <th className="p-3 border-b">Respostas Recentes</th>
                                                <th className="p-3 border-b w-32">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {answers.filter(a => a.question_id === q.id).map(a => (
                                                <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="p-3">{a.answer_text}</td>
                                                    <td className="p-3 text-slate-400 text-xs">
                                                        {new Date(a.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {answers.filter(a => a.question_id === q.id).length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="p-4 text-center text-slate-400">Sem respostas ainda</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
