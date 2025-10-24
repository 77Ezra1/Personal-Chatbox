const connections = new Map();

function addClient(agentId, res) {
  if (!connections.has(agentId)) {
    connections.set(agentId, new Set());
  }
  connections.get(agentId).add(res);
}

function removeClient(agentId, res) {
  const set = connections.get(agentId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) {
    connections.delete(agentId);
  }
}

function broadcast(agentId, data) {
  const receivers = connections.get(agentId);
  if (!receivers) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of receivers) {
    res.write(payload);
  }
}

module.exports = {
  addClient,
  removeClient,
  broadcast
};
