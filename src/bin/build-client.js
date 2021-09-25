import process from 'node:process'
import fs from 'node:fs/promises'
import esbuild from 'esbuild'
import htmlPlugin from '@chialab/esbuild-plugin-html'

const ENTRY_POINT = new URL('../client/index.html', import.meta.url)
const OUTDIR = new URL('../../build/', import.meta.url)

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [ENTRY_POINT.pathname],
  outdir: OUTDIR.pathname,
  // @ts-ignore
  plugins: [htmlPlugin()],
  loader: {
    '.js': 'jsx',
    '.svg': 'file'
  }
}

async function productionBuild () {
  await fs.rm(OUTDIR, { recursive: true }).catch(() => {})
  await esbuild.build({
    ...options,
    minify: true,
    entryNames: 'assets/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    bundle: true,
    watch: process.argv.includes('--watch')
  })
}

productionBuild()
