export type RankedResource = {
  priority: number
  createdAt: Date | string
}

function comesBefore<T extends RankedResource>(left: T, right: T) {
  if (left.priority !== right.priority) return left.priority > right.priority
  return new Date(left.createdAt).getTime() > new Date(right.createdAt).getTime()
}

export function rankResources<T extends RankedResource>(items: T[]) {
  const heap: T[] = []
  const push = (item: T) => {
    heap.push(item)
    let index = heap.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (comesBefore(heap[parent], heap[index])) break
      ;[heap[parent], heap[index]] = [heap[index], heap[parent]]
      index = parent
    }
  }
  const pop = () => {
    const first = heap[0]
    const last = heap.pop()
    if (heap.length && last) {
      heap[0] = last
      let index = 0
      while (true) {
        const left = index * 2 + 1
        const right = left + 1
        let best = index
        if (left < heap.length && comesBefore(heap[left], heap[best])) best = left
        if (right < heap.length && comesBefore(heap[right], heap[best])) best = right
        if (best === index) break
        ;[heap[index], heap[best]] = [heap[best], heap[index]]
        index = best
      }
    }
    return first
  }

  items.forEach(push)
  const ranked: T[] = []
  while (heap.length) {
    const next = pop()
    if (next) ranked.push(next)
  }
  return ranked
}
