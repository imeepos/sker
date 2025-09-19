/** @type {import("prettier").Config} */
module.exports = {
  // 基础配置
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JSX 配置
  jsxSingleQuote: true,
  
  // 尾随逗号
  trailingComma: 'es5',
  
  // 括号配置
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // 换行符
  endOfLine: 'lf',
  
  // 嵌入语言格式化
  embeddedLanguageFormatting: 'auto',
  
  // 文件覆盖配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 120,
        proseWrap: 'preserve',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
  ],
  
  // 插件
  plugins: ['prettier-plugin-tailwindcss'],
};