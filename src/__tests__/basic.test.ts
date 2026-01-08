import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass a simple assertion', () => {
    expect(true).toBe(true);
  });

  it('should correctly add numbers', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const str = 'Hello World';
    expect(str.toLowerCase()).toBe('hello world');
  });
});

describe('Array Operations', () => {
  it('should filter arrays correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    const filtered = arr.filter(n => n > 3);
    expect(filtered).toEqual([4, 5]);
  });

  it('should map arrays correctly', () => {
    const arr = [1, 2, 3];
    const mapped = arr.map(n => n * 2);
    expect(mapped).toEqual([2, 4, 6]);
  });
});
