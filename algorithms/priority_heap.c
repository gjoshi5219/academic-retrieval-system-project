#include <stdio.h>

#define CAPACITY 64

typedef struct {
    int priority;
    int index;
} Resource;

static void swap(Resource *a, Resource *b) {
    Resource temporary = *a;
    *a = *b;
    *b = temporary;
}

static void sift_down(Resource heap[], int size, int root) {
    for (;;) {
        int largest = root;
        int left = root * 2 + 1;
        int right = left + 1;
        if (left < size && heap[left].priority > heap[largest].priority) largest = left;
        if (right < size && heap[right].priority > heap[largest].priority) largest = right;
        if (largest == root) return;
        swap(&heap[root], &heap[largest]);
        root = largest;
    }
}

void rank_by_priority(Resource heap[], int size) {
    for (int root = size / 2 - 1; root >= 0; --root) sift_down(heap, size, root);
    for (int end = size - 1; end > 0; --end) {
        swap(&heap[0], &heap[end]);
        sift_down(heap, end, 0);
    }
}

#ifdef DEMO
int main(void) {
    Resource items[] = {{4, 0}, {10, 1}, {7, 2}, {9, 3}};
    int count = (int)(sizeof(items) / sizeof(items[0]));
    rank_by_priority(items, count);
    for (int i = count - 1; i >= 0; --i) printf("priority=%d resource=%d\n", items[i].priority, items[i].index);
    return 0;
}
#endif
