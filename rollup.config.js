import { terser } from 'rollup-plugin-terser'
// plugin-node-resolve and plugin-commonjs are required for a rollup bundled project
// to resolve dependencies from node_modules. See the documentation for these plugins
// for more details.
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace';


export default {
  input: 'src/index.ts',
  output: {
    exports: 'named',
    format: 'es',
    file: 'dist/index.mjs',
    sourcemap: true,
    plugins: [terser()]
  },
  plugins: [
    typescript(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    commonjs(),
    nodeResolve({ browser: true })],
}