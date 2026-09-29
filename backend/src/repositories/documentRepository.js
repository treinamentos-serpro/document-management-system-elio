function createDocumentRepository() {
  const documents = new Map();

  return {
    add(document) {
      documents.set(document.id, { ...document });
      return { ...document };
    },

    listByOwner(owner) {
      return Array.from(documents.values())
        .filter((document) => document.owner === owner)
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
        .map((document) => ({ ...document }));
    },

    findByIdAndOwner(id, owner) {
      const document = documents.get(id);
      return document && document.owner === owner ? { ...document } : null;
    },
  };
}

module.exports = { createDocumentRepository };