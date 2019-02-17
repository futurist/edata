// rollup.config.js
import { parse } from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import globby from 'globby'

let config = [
  {
    input: './src/index.js',
    plugins: [
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

config = config.concat(globby.sync('./src/extensions/*.js').map(inputFile => {
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
      { format: 'umd', file: 'extensions/' + base, name: 'edata_' + name }
    ]
  }
}))

export default config
