// Removido o '=' extra da URL e corrigida a inicialização
const supabaseUrl = 'https://cfgtyyyprsrgdvoogodi.supabase.co';
const supabaseAnonKey = 'sb_publishable_LQaPDrEQblzwBWjmh4NPhA_K7mPtqaP';

// Inicializa o cliente globalmente usando a biblioteca carregada no index.html
const _supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

console.log('Cliente Supabase inicializado com sucesso!');


