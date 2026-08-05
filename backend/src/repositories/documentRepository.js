const documents = [];

function save(documentMetadata) {
  documents.push(documentMetadata);
  return documentMetadata;
}

function findAll() {
  // Retorna uma cópia para evitar mutações fora do repositório.
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

function clear() {
  documents.length = 0;
}

module.exports = {
  save,
  findAll,
  findById,
  clear,
};
