import type { ProblemSummary } from "./leetcode";

/** A curated ladder of interview classics: also the offline fallback when LeetCode is unreachable. */
export const CURATED: ProblemSummary[] = [
  { number: "1", title: "Two Sum", slug: "two-sum", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Array", "Hash Table"] },
  { number: "121", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Array", "Dynamic Programming"] },
  { number: "217", title: "Contains Duplicate", slug: "contains-duplicate", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Array", "Hash Table"] },
  { number: "242", title: "Valid Anagram", slug: "valid-anagram", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["String", "Hash Table"] },
  { number: "125", title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Two Pointers", "String"] },
  { number: "20", title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Stack", "String"] },
  { number: "206", title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Linked List"] },
  { number: "21", title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Linked List"] },
  { number: "704", title: "Binary Search", slug: "binary-search", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Array", "Binary Search"] },
  { number: "226", title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Tree", "DFS"] },
  { number: "104", title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Tree", "DFS"] },
  { number: "53", title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Array", "Dynamic Programming"] },
  { number: "3", title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["String", "Sliding Window"] },
  { number: "11", title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Two Pointers", "Array"] },
  { number: "15", title: "3Sum", slug: "3sum", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Two Pointers", "Array"] },
  { number: "33", title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Binary Search"] },
  { number: "42", title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Two Pointers", "Stack"] },
  { number: "56", title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Sorting", "Array"] },
  { number: "200", title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Graph", "BFS", "DFS"] },
  { number: "207", title: "Course Schedule", slug: "course-schedule", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Graph", "Topological Sort"] },
  { number: "146", title: "LRU Cache", slug: "lru-cache", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Hash Table", "Linked List"] },
  { number: "215", title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Heap", "Quickselect"] },
  { number: "239", title: "Sliding Window Maximum", slug: "sliding-window-maximum", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Queue", "Sliding Window"] },
  { number: "76", title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Sliding Window", "Hash Table"] },
  { number: "23", title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Heap", "Linked List"] },
  { number: "102", title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Tree", "BFS"] },
  { number: "98", title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Tree", "DFS"] },
  { number: "105", title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Tree", "Recursion"] },
  { number: "994", title: "Rotting Oranges", slug: "rotting-oranges", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Graph", "BFS"] },
  { number: "133", title: "Clone Graph", slug: "clone-graph", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Graph", "DFS"] },
  { number: "70", title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Dynamic Programming"] },
  { number: "322", title: "Coin Change", slug: "coin-change", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Dynamic Programming"] },
  { number: "300", title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Dynamic Programming", "Binary Search"] },
  { number: "1143", title: "Longest Common Subsequence", slug: "longest-common-subsequence", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Dynamic Programming", "Matrix"] },
  { number: "136", title: "Single Number", slug: "single-number", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Bit Manipulation"] },
  { number: "191", title: "Number of 1 Bits", slug: "number-of-1-bits", difficulty: "Easy", paidOnly: false, acceptance: "—", tags: ["Bit Manipulation"] },
  { number: "155", title: "Min Stack", slug: "min-stack", difficulty: "Medium", paidOnly: false, acceptance: "—", tags: ["Stack"] },
  { number: "84", title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Stack", "Monotonic Stack"] },
  { number: "295", title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Heap"] },
  { number: "25", title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", difficulty: "Hard", paidOnly: false, acceptance: "—", tags: ["Linked List", "Recursion"] },
];

export const TODAYS_PICK = {
  number: "121",
  title: "Best Time to Buy and Sell Stock",
  slug: "best-time-to-buy-and-sell-stock",
  tags: ["Array", "One pass"],
  complexity: "O(n) time · O(1) space",
  difficulty: "Easy" as const,
};

export const COMPANY_LOGOS = ["Google", "Amazon", "Microsoft", "Meta"];

export const VISUALISERS = [
  { name: "Arrays", detail: "pointers, windows, prefixes", glyph: "[ ]" },
  { name: "Strings", detail: "two pointers, palindromes", glyph: "ab" },
  { name: "Hash Maps", detail: "seen sets, frequency maps", glyph: "{ }" },
  { name: "Linked Lists", detail: "reversal, fast & slow", glyph: "o-o" },
  { name: "Trees", detail: "DFS, BFS, recursion", glyph: "Y" },
  { name: "Graphs", detail: "traversals, topo sort", glyph: "◇" },
  { name: "Stacks", detail: "monotonic, call stack", glyph: "▤" },
  { name: "Queues", detail: "BFS layers, deques", glyph: "⇥" },
];
