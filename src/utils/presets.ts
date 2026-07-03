import { PresetAlgorithm, TraceStep } from "../types";

export const PRESET_ALGORITHMS: PresetAlgorithm[] = [
  {
    id: "bubble",
    name: "Bubble Sort",
    description: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    codeTemplates: {
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                # Swap adjacent elements
                arr[j], arr[j+1] = arr[j+1], arr[j]`,
      java: `public class BubbleSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    // Swap elements
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`,
      c: `void bubbleSort(int arr[], int n) {
    int i, j;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
    generateSteps: (arr: number[]): TraceStep[] => {
      const steps: TraceStep[] = [];
      const temp = [...arr];
      const n = temp.length;

      steps.push({
        type: "highlight",
        indices: [],
        arrayState: [...temp],
        explanation: "Initialize Bubble Sort. Ready to scan from left to right."
      });

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          steps.push({
            type: "compare",
            indices: [j, j + 1],
            values: [temp[j], temp[j + 1]],
            arrayState: [...temp],
            explanation: `Compare index ${j} (${temp[j]}) and index ${j + 1} (${temp[j + 1]}).`
          });

          if (temp[j] > temp[j + 1]) {
            const swapVal = temp[j];
            temp[j] = temp[j + 1];
            temp[j + 1] = swapVal;
            steps.push({
              type: "swap",
              indices: [j, j + 1],
              values: [temp[j], temp[j + 1]],
              arrayState: [...temp],
              explanation: `Since ${swapVal} > ${temp[j]}, we swap them.`
            });
          }
        }

        steps.push({
          type: "complete",
          indices: [n - i - 1],
          values: [temp[n - i - 1]],
          arrayState: [...temp],
          explanation: `Pass complete. Element at index ${n - i - 1} (${temp[n - i - 1]}) is locked in its final sorted position.`
        });
      }

      steps.push({
        type: "complete",
        indices: Array.from({ length: n }, (_, k) => k),
        arrayState: [...temp],
        explanation: "Array is fully sorted!"
      });

      return steps;
    }
  },
  {
    id: "selection",
    name: "Selection Sort",
    description: "Divides the array into a sorted and unsorted region, repeatedly finds the minimum element from the unsorted part, and swaps it to the front.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    codeTemplates: {
      python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        # Swap found minimum with current element
        arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
      java: `public class SelectionSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            // Swap elements
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }
    }
}`,
      c: `void selectionSort(int arr[], int n) {
    int i, j, minIdx;
    for (i = 0; i < n - 1; i++) {
        minIdx = i;
        for (j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        // Swap elements
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`
    },
    generateSteps: (arr: number[]): TraceStep[] => {
      const steps: TraceStep[] = [];
      const temp = [...arr];
      const n = temp.length;

      steps.push({
        type: "highlight",
        indices: [],
        arrayState: [...temp],
        explanation: "Initialize Selection Sort. Clear boundary of sorted and unsorted sections."
      });

      for (let i = 0; i < n; i++) {
        let minIdx = i;
        steps.push({
          type: "highlight",
          indices: [minIdx],
          values: [temp[minIdx]],
          arrayState: [...temp],
          explanation: `Assume current index ${i} (${temp[i]}) holds the minimum value.`
        });

        for (let j = i + 1; j < n; j++) {
          steps.push({
            type: "compare",
            indices: [j, minIdx],
            values: [temp[j], temp[minIdx]],
            arrayState: [...temp],
            explanation: `Compare index ${j} (${temp[j]}) with current minimum at index ${minIdx} (${temp[minIdx]}).`
          });

          if (temp[j] < temp[minIdx]) {
            minIdx = j;
            steps.push({
              type: "highlight",
              indices: [minIdx],
              values: [temp[minIdx]],
              arrayState: [...temp],
              explanation: `Found smaller element! Update current minimum to index ${minIdx} (${temp[minIdx]}).`
            });
          }
        }

        if (minIdx !== i) {
          const swapVal = temp[i];
          temp[i] = temp[minIdx];
          temp[minIdx] = swapVal;
          steps.push({
            type: "swap",
            indices: [i, minIdx],
            values: [temp[i], temp[minIdx]],
            arrayState: [...temp],
            explanation: `Swap minimum value ${temp[i]} with index ${i} (${swapVal}).`
          });
        }

        steps.push({
          type: "complete",
          indices: [i],
          values: [temp[i]],
          arrayState: [...temp],
          explanation: `Element at index ${i} (${temp[i]}) is now sorted.`
        });
      }

      steps.push({
        type: "complete",
        indices: Array.from({ length: n }, (_, k) => k),
        arrayState: [...temp],
        explanation: "Array is fully sorted!"
      });

      return steps;
    }
  },
  {
    id: "insertion",
    name: "Insertion Sort",
    description: "Builds a sorted array one element at a time by inserting each new element into its proper position in the already-sorted prefix.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    codeTemplates: {
      python: `def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        key = arr[i]
        j = i - 1
        # Shift elements larger than key to the right
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`,
      java: `public class InsertionSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j = j - 1;
            }
            arr[j + 1] = key;
        }
    }
}`,
      c: `void insertionSort(int arr[], int n) {
    int i, key, j;
    for (i = 1; i < n; i++) {
        key = arr[i];
        j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}`
    },
    generateSteps: (arr: number[]): TraceStep[] => {
      const steps: TraceStep[] = [];
      const temp = [...arr];
      const n = temp.length;

      steps.push({
        type: "highlight",
        indices: [],
        arrayState: [...temp],
        explanation: "Initialize Insertion Sort. Elements before the active key are sorted."
      });

      for (let i = 1; i < n; i++) {
        const key = temp[i];
        let j = i - 1;

        steps.push({
          type: "highlight",
          indices: [i],
          values: [key],
          arrayState: [...temp],
          explanation: `Select key element ${key} at index ${i}. Preparing to insert it into the sorted sub-array on the left.`
        });

        while (j >= 0 && temp[j] > key) {
          steps.push({
            type: "compare",
            indices: [j, j + 1],
            values: [temp[j], key],
            arrayState: [...temp],
            explanation: `Compare key ${key} with element ${temp[j]} at index ${j}. Since ${temp[j]} > ${key}, we must shift.`
          });

          temp[j + 1] = temp[j];

          steps.push({
            type: "shift",
            indices: [j + 1],
            values: [temp[j]],
            arrayState: [...temp],
            explanation: `Shift ${temp[j]} right to index ${j + 1}.`
          });

          j--;
        }

        temp[j + 1] = key;

        steps.push({
          type: "write",
          indices: [j + 1],
          values: [key],
          arrayState: [...temp],
          explanation: `Insert key ${key} at index ${j + 1}.`
        });
      }

      steps.push({
        type: "complete",
        indices: Array.from({ length: n }, (_, k) => k),
        arrayState: [...temp],
        explanation: "Insertion Sort complete. All elements are perfectly sorted!"
      });

      return steps;
    }
  },
  {
    id: "merge",
    name: "Merge Sort",
    description: "A divide-and-conquer algorithm. It divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    codeTemplates: {
      python: `def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]
        
        # Recursive split
        merge_sort(L)
        merge_sort(R)
        
        # Merge sub-arrays
        i = j = k = 0
        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1
            
        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1
        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1`,
      java: `public class MergeSort {
    public static void sort(int[] arr, int l, int r) {
        if (l < r) {
            int m = l + (r - l) / 2;
            sort(arr, l, m);
            sort(arr, m + 1, r);
            merge(arr, l, m, r);
        }
    }

    private static void merge(int[] arr, int l, int m, int r) {
        int n1 = m - l + 1;
        int n2 = r - m;
        int[] L = new int[n1];
        int[] R = new int[n2];

        for (int i = 0; i < n1; ++i) L[i] = arr[l + i];
        for (int j = 0; j < n2; ++j) R[j] = arr[m + 1 + j];

        int i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }
        while (i < n1) {
            arr[k] = L[i]; i++; k++;
        }
        while (j < n2) {
            arr[k] = R[j]; j++; k++;
        }
    }
}`,
      c: `void merge(int arr[], int l, int m, int r) {
    int i, j, k;
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[n1], R[n2];

    for (i = 0; i < n1; i++) L[i] = arr[l + i];
    for (j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    i = 0; j = 0; k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i]; i++; k++;
    }
    while (j < n2) {
        arr[k] = R[j]; j++; k++;
    }
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`
    },
    generateSteps: (arr: number[]): TraceStep[] => {
      const steps: TraceStep[] = [];
      const temp = [...arr];

      steps.push({
        type: "highlight",
        indices: [],
        arrayState: [...temp],
        explanation: "Initialize Merge Sort. Dividing array recursively into binary halves."
      });

      const mergeSortHelper = (l: number, r: number) => {
        if (l < r) {
          const m = Math.floor((l + r) / 2);
          steps.push({
            type: "highlight",
            indices: Array.from({ length: r - l + 1 }, (_, i) => l + i),
            arrayState: [...temp],
            explanation: `Focus on subarray segment from index ${l} to ${r}. Splitting at midpoint index ${m}.`
          });

          mergeSortHelper(l, m);
          mergeSortHelper(m + 1, r);
          merge(l, m, r);
        }
      };

      const merge = (l: number, m: number, r: number) => {
        const n1 = m - l + 1;
        const n2 = r - m;

        const L = temp.slice(l, m + 1);
        const R = temp.slice(m + 1, r + 1);

        let i = 0, j = 0, k = l;

        steps.push({
          type: "highlight",
          indices: [l, r],
          arrayState: [...temp],
          explanation: `Preparing to merge sorted sub-arrays: [${L.join(", ")}] and [${R.join(", ")}].`
        });

        while (i < n1 && j < n2) {
          steps.push({
            type: "compare",
            indices: [l + i, m + 1 + j],
            values: [L[i], R[j]],
            arrayState: [...temp],
            explanation: `Compare left element ${L[i]} at index ${l + i} with right element ${R[j]} at index ${m + 1 + j}.`
          });

          if (L[i] <= R[j]) {
            temp[k] = L[i];
            steps.push({
              type: "write",
              indices: [k],
              values: [L[i]],
              arrayState: [...temp],
              explanation: `Write ${L[i]} from left sub-array to merged index ${k}.`
            });
            i++;
          } else {
            temp[k] = R[j];
            steps.push({
              type: "write",
              indices: [k],
              values: [R[j]],
              arrayState: [...temp],
              explanation: `Write ${R[j]} from right sub-array to merged index ${k}.`
            });
            j++;
          }
          k++;
        }

        while (i < n1) {
          temp[k] = L[i];
          steps.push({
            type: "write",
            indices: [k],
            values: [L[i]],
            arrayState: [...temp],
            explanation: `Append remaining left element ${L[i]} to index ${k}.`
          });
          i++;
          k++;
        }

        while (j < n2) {
          temp[k] = R[j];
          steps.push({
            type: "write",
            indices: [k],
            values: [R[j]],
            arrayState: [...temp],
            explanation: `Append remaining right element ${R[j]} to index ${k}.`
          });
          j++;
          k++;
        }

        steps.push({
          type: "complete",
          indices: Array.from({ length: r - l + 1 }, (_, idx) => l + idx),
          arrayState: [...temp],
          explanation: `Sub-segment from index ${l} to ${r} successfully merged: [${temp.slice(l, r + 1).join(", ")}].`
        });
      };

      mergeSortHelper(0, temp.length - 1);

      steps.push({
        type: "complete",
        indices: Array.from({ length: temp.length }, (_, k) => k),
        arrayState: [...temp],
        explanation: "Merge Sort complete. The entire array is perfectly merged and sorted!"
      });

      return steps;
    }
  },
  {
    id: "quick",
    name: "Quick Sort",
    description: "Pick an element as a pivot and partitions the given array around the picked pivot by placing pivot in its correct position.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    codeTemplates: {
      python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)`,
      java: `public class QuickSort {
    public static void sort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            sort(arr, low, pi - 1);
            sort(arr, pi + 1, high);
        }
    }

    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = (low - 1);
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }
}`,
      c: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`
    },
    generateSteps: (arr: number[]): TraceStep[] => {
      const steps: TraceStep[] = [];
      const temp = [...arr];

      steps.push({
        type: "highlight",
        indices: [],
        arrayState: [...temp],
        explanation: "Initialize Quick Sort. Ready to select pivots and partition segments."
      });

      const quickSortHelper = (low: number, high: number) => {
        if (low < high) {
          const pi = partition(low, high);
          quickSortHelper(low, pi - 1);
          quickSortHelper(pi + 1, high);
        } else if (low === high) {
          steps.push({
            type: "complete",
            indices: [low],
            values: [temp[low]],
            arrayState: [...temp],
            explanation: `Element at index ${low} (${temp[low]}) is in its final position.`
          });
        }
      };

      const partition = (low: number, high: number): number => {
        const pivot = temp[high];
        steps.push({
          type: "highlight",
          indices: [high],
          values: [pivot],
          arrayState: [...temp],
          explanation: `Select pivot element ${pivot} at index ${high} for partition segment [${low}, ${high}].`
        });

        let i = low - 1;
        for (let j = low; j < high; j++) {
          steps.push({
            type: "compare",
            indices: [j, high],
            values: [temp[j], pivot],
            arrayState: [...temp],
            explanation: `Compare arr[${j}] (${temp[j]}) with pivot ${pivot}.`
          });

          if (temp[j] < pivot) {
            i++;
            if (i !== j) {
              const swapVal = temp[i];
              temp[i] = temp[j];
              temp[j] = swapVal;
              steps.push({
                type: "swap",
                indices: [i, j],
                values: [temp[i], temp[j]],
                arrayState: [...temp],
                explanation: `Since ${temp[i]} < pivot ${pivot}, swap arr[${i}] (${temp[i]}) with arr[${j}] (${temp[j]}).`
              });
            }
          }
        }

        const swapVal = temp[i + 1];
        temp[i + 1] = temp[high];
        temp[high] = swapVal;

        steps.push({
          type: "swap",
          indices: [i + 1, high],
          values: [temp[i + 1], temp[high]],
          arrayState: [...temp],
          explanation: `Place pivot ${pivot} into its correct sorted location at index ${i + 1} by swapping with index ${high} (${swapVal}).`
        });

        steps.push({
          type: "complete",
          indices: [i + 1],
          values: [temp[i + 1]],
          arrayState: [...temp],
          explanation: `Pivot element at index ${i + 1} (${temp[i + 1]}) is now locked in its final sorted position.`
        });

        return i + 1;
      };

      quickSortHelper(0, temp.length - 1);

      steps.push({
        type: "complete",
        indices: Array.from({ length: temp.length }, (_, k) => k),
        arrayState: [...temp],
        explanation: "Quick Sort complete. All partitions resolved and elements sorted!"
      });

      return steps;
    }
  }
];
