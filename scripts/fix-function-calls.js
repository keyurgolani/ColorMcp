#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars, no-console */

/**
 * Script to fix function calls in test files to use the correct tool handlers
 */

import fs from 'fs';

const functionMappings = {
  'generateHarmonyPalette(': 'generateHarmonyPaletteTool.handler(',
  'createThemePreviewHtml(': 'createThemePreviewHtmlTool.handler(',
  'exportCss(': 'exportCssTool.handler(',
  'exportScss(': 'exportScssTool.handler(',
  'exportTailwind(': 'exportTailwindTool.handler(',
  'convertColor(': 'convertColorTool.handler(',
  'createPaletteHtml(': 'createPaletteHtmlTool.handler(',
  'createPalettePng(': 'createPalettePngTool.handler(',
  'createColorWheelHtml(': 'createColorWheelHtmlTool.handler(',
  'createColorComparisonPng(': 'createColorComparisonPngTool.handler(',
  'generateLinearGradient(': 'generateLinearGradientTool.handler(',
  'createGradientHtml(': 'createGradientHtmlTool.handler(',
  'exportJson(': 'exportJsonTool.handler(',
  'generateTheme(': 'generateThemeTool.handler(',
  'checkContrast(': 'checkContrastTool.handler(',
  'analyzeColor(': 'analyzeColorTool.handler(',
};

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldCall, newCall] of Object.entries(functionMappings)) {
    if (content.includes(oldCall)) {
      content = content.replace(
        new RegExp(oldCall.replace('(', '\\('), 'g'),
        newCall
      );
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
  } else {
    console.log(`  No changes needed for ${filePath}`);
  }
}

// Fix the specific test files
const testFiles = [
  'tests/integration/end-to-end-comprehensive.test.ts',
  'tests/quality-assurance/comprehensive-qa.test.ts',
];

testFiles.forEach(fixFile);

console.log('Done!');
