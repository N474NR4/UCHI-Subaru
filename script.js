// Configuração do IndexedDB (simulando SQLite)
const dbName = 'SubaruDB';
const dbVersion = 1;
let db;

// Abrir IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains('models')) {
                const store = db.createObjectStore('models', { keyPath: 'id', autoIncrement: true });
                store.createIndex('model_name', 'model_name', { unique: false });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

// Operações CRUD
const addModel = async (model) => {
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    store.add(model);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const getAllModels = async () => {
    const transaction = db.transaction(['models'], 'readonly');
    const store = transaction.objectStore('models');
    return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
};

const updateModel = async (model) => {
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    store.put(model);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const deleteModel = async (id) => {
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    store.delete(id);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const clearDB = async () => {
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    store.clear();
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

// Elementos DOM
const tableBody = document.getElementById('tableBody');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modelForm = document.getElementById('modelForm');
const modelName = document.getElementById('modelName');
const modelYear = document.getElementById('modelYear');
const modelPrice = document.getElementById('modelPrice');
const modelDesc = document.getElementById('modelDesc');
const modelImage = document.getElementById('modelImage');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('searchInput');
let editingId = null;

// Renderizar tabela
const renderTable = async (filter = '') => {
    const models = await getAllModels();
    const filteredModels = models.filter(model => model.model_name.toLowerCase().includes(filter.toLowerCase()));
    tableBody.innerHTML = '';
    filteredModels.forEach(model => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${model.id}</td>
            <td>${model.model_name}</td>
            <td>${model.year}</td>
            <td>R$ ${model.price.toFixed(2)}</td>
            <td>${model.description}</td>
            <td>${model.image_url ? `<img src="${model.image_url}" alt="Imagem" style="width: 50px; height: auto;">` : 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${model.id}">Alterar</button>
                <button class="action-btn delete-btn" data-id="${model.id}">Deletar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

// Abrir modal para inserir
document.getElementById('insertBtn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Inserir Novo Modelo';
    modelForm.reset();
    modal.style.display = 'block';
});

// Botão Select (listar)
document.getElementById('selectBtn').addEventListener('click', () => renderTable());

// Pesquisa com debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderTable(searchInput.value), 300);
});

// Editar ao clicar na linha
tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const id = parseInt(e.target.dataset.id);
        const models = await getAllModels();
        const model = models.find(m => m.id === id);
        if (model) {
            editingId = id;
            modalTitle.textContent = 'Alterar Modelo';
            modelName.value = model.model_name;
            modelYear.value = model.year;
            modelPrice.value = model.price;
            modelDesc.value = model.description;
            modelImage.value = model.image_url || '';
            modal.style.display = 'block';
        }
    } else if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Tem certeza que deseja deletar este modelo?')) {
            await deleteModel(id);
            renderTable(searchInput.value);
            alert('Modelo deletado com sucesso!');
        }
    }
});

// Submeter formulário
modelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const model = {
        model_name: modelName.value,
        year: parseInt(modelYear.value),
        price: parseFloat(modelPrice.value),
        description: modelDesc.value,
        image_url: modelImage.value || null
    };
    if (editingId) {
        model.id = editingId;
        await updateModel(model);
        alert('Modelo alterado com sucesso!');
    } else {
        await addModel(model);
        alert('Modelo inserido com sucesso!');
    }
    modal.style.display = 'none';
    renderTable(searchInput.value);
});

// Fechar modal
document.querySelector('.close').addEventListener('click', () => {
    modal.style.display = 'none';
});

// Limpar banco (para testes)
document.getElementById('clearBtn').addEventListener('click', async () => {
    if (confirm('Isso limpará todos os dados. Continuar?')) {
        await clearDB();
        renderTable();
        alert('Banco limpo!');
    }
});

// Inicializar
(async () => {
    await openDB();
    renderTable();
})();