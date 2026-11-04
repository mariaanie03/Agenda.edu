const supabaseUrl = 'https://cfgtyyyprsrgdvoogodi.supabase.co';
const supabaseAnonKey = 'sb_publishable_LQaPDrEQblzwBWjmh4NPhA_K7mPtqaP';

// Substitua 'frutas' pelo nome exato da sua tabela no banco de dados, se for diferente
const nomeTabela = 'usuarios'; 

async function buscar() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${nomeTabela}?select=*`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }

    const dados = await response.json();
    console.log('Suas frutas:', dados);
    return dados;
  } catch (error) {
    console.error('Erro ao buscar frutas:', error);
  }
}

// Executa a função
buscar();
