// The viewer's script as it goes into a page: the explanatory comments (which quote sample
// markup) and blank lines removed, so every page carries ~2 KB of code and no stray <dialog>.
// The source has no '//' inside a string, which is what makes the line-comment rule safe; the
// test in test/inline.test.mjs keeps it that way.
export function inlineScript(source) {
  return source
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/[ \t]+\/\/ [^\n]*$/gm, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
