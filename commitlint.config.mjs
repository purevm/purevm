export default {
  extends: ["@commitlint/config-conventional"],
  defaultIgnores: false,
  rules: {
    "body-empty": [2, "always"],
    "header-max-length": [2, "always", 160],
    "scope-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "refactor",
        "test",
        "build",
        "ci",
        "chore",
        "perf",
        "style",
        "revert",
      ],
    ],
  },
};
