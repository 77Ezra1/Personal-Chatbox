const { EventEmitter } = require('events');

class ExecutionEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  emitUpdate(agentId, executionId, payload) {
    this.emit('execution_update', { agentId, executionId, payload, timestamp: Date.now() });
  }

  subscribe(agentId, listener) {
    const wrapped = (event) => {
      if (!agentId || event.agentId === agentId) {
        listener(event);
      }
    };
    this.on('execution_update', wrapped);
    return () => this.off('execution_update', wrapped);
  }
}

module.exports = new ExecutionEvents();
