// rollup.config.js
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default [
  {
    input: './src/index.js',
    plugins: [
      buble(),
      resolve({
        preferBuiltins: false
      }),
      commonjs()
    ],
    output: [
      { format: 'cjs', file: 'dist/cjs.js' },
      { format: 'umd', file: 'dist/umd.js', name: 'rdata' }
    ]
  },

  {
    input: './src/index.js',
    plugins: [
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
    input: './src/index.js',
    plugins: [
      buble(),
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
