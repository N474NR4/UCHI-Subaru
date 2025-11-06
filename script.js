// Inicializar sql.js
let SQL;
let db;

initSqlJs({ locateFile: file => `sql-wasm.wasm` }).then(function(sql) {
    SQL = sql;
    db = new SQL.Database();
    
    // Criar tabela se não existir
    db.run("CREATE TABLE IF NOT EXISTS carros (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo TEXT, ano INTEGER, preco REAL)");
    
    // Carregar lista inicial
    loadCars();
});

// Função para carregar e exibir carros (SELECT)
function loadCars() {
    const result = db.exec("SELECT * FROM carros");
    const carList = document.getElementById('car-list');
    carList.innerHTML = '';
    
    if (result.length > 0) {
        const rows = result[0].values;
        rows.forEach(row => {
            const [id, modelo, ano, preco] = row;
            const carDiv = document.createElement('div');
            carDiv.className = 'car-item';
            carDiv.innerHTML = `
                <h3>${modelo}</h3>
                <p>Ano: ${ano}</p>
                <p>Preço: R$ ${preco.toFixed(2)}</p>
                <button onclick="editCar(${id})">Editar</button>
                <button onclick="deleteCar(${id})">Deletar</button>
            `;
            carList.appendChild(carDiv);
        });
    } else {
        carList.innerHTML = '<p>Nenhum carro no estoque.</p>';
    }
}

// Função para adicionar/editar carro (INSERT/UPDATE)
document.getElementById('car-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('car-id').value;
    const modelo = document.getElementById('modelo').value;
    const ano = document.getElementById('ano').value;
    const preco = document.getElementById('preco').value;
    
    if (id) {
        // UPDATE
        db.run("UPDATE carros SET modelo=?, ano=?, preco=? WHERE id=?", [modelo, ano, preco, id]);
    } else {
        // INSERT
        db.run("INSERT INTO carros (modelo, ano, preco) VALUES (?, ?, ?)", [modelo, ano, preco]);
    }
    
    resetForm();
    loadCars();
});

// Função para editar carro (preencher formulário)
function editCar(id) {
    const result = db.exec("SELECT * FROM carros WHERE id=?", [id]);
    if (result.length > 0) {
        const [row] = result[0].values;
        document.getElementById('car-id').value = row[0];
        document.getElementById('modelo').value = row[1];
        document.getElementById('ano').value = row[2];
        document.getElementById('preco').value = row[3];
        document.getElementById('submit-btn').textContent = 'Atualizar Carro';
        document.getElementById('cancel-btn').style.display = 'inline-block';
    }
}

// Função para deletar carro (DELETE)
function deleteCar(id) {
    if (confirm('Tem certeza que deseja deletar este carro?')) {
        db.run("DELETE FROM carros WHERE id=?", [id]);
        loadCars();
    }
}

// Função para deletar tabela (DROP)
document.getElementById('drop-table-btn').addEventListener('click', function() {
    if (confirm('Isso irá deletar toda a tabela e dados. Continuar?')) {
        db.run("DROP TABLE carros");
        db.run("CREATE TABLE carros (id INTEGER PRIMARY KEY AUTOINCREMENT, modelo TEXT, ano INTEGER, preco REAL)");
        loadCars();
    }
});

// Função para resetar formulário
function resetForm() {
    document.getElementById('car-form').reset();
    document.getElementById('car-id').value = '';
    document.getElementById('submit-btn').textContent = 'Adicionar Carro';
    document.getElementById('cancel-btn').style.display = 'none';
}

// Cancelar edição
document.getElementById('cancel-btn').addEventListener('click', resetForm);