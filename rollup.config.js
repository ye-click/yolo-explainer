import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import rollup_start_dev from './rollup_start_dev';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/bundle.js'
  },
  plugins: [
    svelte({
      dev: !production,
      css: css => {
        css.write('bundle.css');
      }
    }),
    replace({PUBLIC_URL: production ? '/yolo-explainer' : ''}),
    resolve({
      browser: true,
      dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
    }),
    commonjs(),
    !production && rollup_start_dev,
    !production && livereload('public'),
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};
