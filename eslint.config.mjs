import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettier,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // 强制所有控制语句使用花括号
      curly: ["error", "all"],

      // 强制使用 === 和 !==，禁止 == 和 !=
      eqeqeq: ["error", "always"],

      // 如果变量不会重新赋值，强制使用 const
      "prefer-const": [
        "error",
        {
          destructuring: "all",
        },
      ],

      // 统一使用 import type 语法
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      // Import 排序和分组
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js 内置模块 (fs, path)
            "external", // npm 包 (react, next)
            "internal", // 项目内部别名 (@/components)
            "parent", // 父目录 (../)
            "sibling", // 同级目录 (./)
            "index", // 当前目录 index
            "type", // 类型导入
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".open-next/**",
      ".wrangler/**",
      "public/sw.js",
    ],
  },
];

export default eslintConfig;
