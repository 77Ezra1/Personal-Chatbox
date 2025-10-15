/**
 * 简单基于内存的路径级互斥锁，避免并发文件写入冲突
 */

const locks = new Map();

function getLockQueue(key) {
  if (!locks.has(key)) {
    locks.set(key, []);
  }
  return locks.get(key);
}

/**
 * 获取指定 key 的独占锁
 * @param {string} key
 * @returns {Promise<() => void>} 释放函数
 */
async function acquireLock(key) {
  return new Promise((resolve) => {
    const queue = getLockQueue(key);

    const tryAcquire = () => {
      if (queue.length === 0 || queue[0] === tryAcquire) {
        if (queue.length === 0) {
          queue.push(tryAcquire);
        }
        resolve(() => releaseLock(key, tryAcquire));
      }
    };

    queue.push(tryAcquire);

    // 如果是第一个，立即尝试
    if (queue[0] === tryAcquire) {
      tryAcquire();
    }
  });
}

function releaseLock(key, token) {
  const queue = getLockQueue(key);
  if (queue[0] === token) {
    queue.shift();
    // 轮到下一个
    if (queue[0]) {
      setImmediate(queue[0]);
    }
  } else {
    // 如果不在队首，删除该 token
    const idx = queue.indexOf(token);
    if (idx >= 0) queue.splice(idx, 1);
  }
}

module.exports = {
  acquireLock
};


