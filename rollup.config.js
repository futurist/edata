// rollup.config.js
import { parse } from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import globby from 'globby'
import pkg from './package.json'

let replacePlugin = replace({
  VERSION: pkg.version
})

let config = [
  {
    input: './src/index.mjs',
    plugins: [
      replacePlugin,
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      babel()
    ],
    output: [
      { format: 'cjs', file: 'dist/cjs.js' },
      { format: 'umd', file: 'dist/umd.js', name: 'edata' }
    ]
  },

  {
    input: './src/index.mjs',
    plugins: [
      replacePlugin,
      resolve({
        preferBuiltins: false
      }),
      commonjs()
    ],
    output: [
      { format: 'es', file: 'dist/es.js' }
    ]
  },

  {
    input: './src/index.mjs',
    plugins: [
      replacePlugin,
      resolve({
        preferBuiltins: true
      }),
      commonjs()
    ],
    external: [ 'events' ],
    output: [
      { format: 'cjs', file: 'dist/node.js' }
    ]
  }

]

config = config.concat(globby.sync('./src/plugins/*.js').map(inputFile => {
  const { name, base } = parse(inputFile)
  return {
    input: inputFile,
    plugins: [
      resolve({
        preferBuiltins: false
      }),
      commonjs(),
      babel()
    ],
    output: [
      { format: 'umd', file: 'plugins/' + base, name: 'edata_' + name }
    ]
  }
}))

export default config
