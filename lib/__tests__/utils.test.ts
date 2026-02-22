import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('単一クラス名を返す', () => {
    expect(cn('px-4')).toBe('px-4');
  });

  it('複数クラス名をマージする', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('Tailwindの競合クラスを後勝ちでマージする', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('条件付きクラス（clsx）を処理する', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('undefinedとnullを無視する', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('空呼び出しで空文字列を返す', () => {
    expect(cn()).toBe('');
  });
});
