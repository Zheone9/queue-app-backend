class Queue {
  constructor() {
    this.items = []
  }

  enqueue(item) {
    this.items.push(item)
  }

  dequeue() {
    if (this.isEmpty()) return 'Underflow'
    return this.items.shift()
  }

  isEmpty() {
    return this.items.length === 0
  }

  findIndex(item) {
    return this.items.indexOf(item)
  }
}

module.exports = {
  Queue
}
