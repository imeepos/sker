import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // 解析后的实际主题
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * 主题Provider组件
 * 提供深色/浅色主题切换功能
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'codex-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从localStorage读取保存的主题设置
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // 获取系统主题偏好
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 计算实际主题
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'system') {
        return getSystemTheme();
      }
      return theme;
    };

    const newActualTheme = resolveTheme();
    setActualTheme(newActualTheme);

    // 应用主题到document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newActualTheme);

    // 设置data属性，方便CSS使用
    root.setAttribute('data-theme', newActualTheme);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      setActualTheme(systemTheme);
      
      // 更新document类名
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
      root.setAttribute('data-theme', systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 更新主题设置
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // 保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme: updateTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 使用主题的Hook
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * 主题切换组件
 */
interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '浅色主题';
      case 'dark':
        return '深色主题';
      case 'system':
        return `跟随系统 (${actualTheme === 'dark' ? '深色' : '浅色'})`;
      default:
        return '浅色主题';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={`当前: ${getThemeLabel()}，点击切换`}
    >
      <span className="mr-2">{getThemeIcon()}</span>
      <span className="hidden sm:inline">{getThemeLabel()}</span>
    </button>
  );
}