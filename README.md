# AcampMiner

A module for the mining feature in Aerfaying Mozhua platform.

## Why this?

- Pretty fast, using worker for boosting.
- Planning WebAssembly with C for further performance.
- Planning GPU calculation (WebGL2), for further performance.

## Development usage

### Testing

Using npm:
```bash
npm i
npm start
```
Or yarn:
```bash
yarn
yarn start
```

Then access [http://localhost:8080/](http://localhost:8080/) by your browser to start benchmark.

### Building

Add `--production` flag if you need.

Using npm:
```bash
npm build --production
```
Or yarn:
```bash
yarn build --production
```

Build wasm requires Emscripten, then execute this command to generate:
```bash
emcc Miner.c -O2 -s EXPORTED_FUNCTIONS=['_sha1'] -s MALLOC=emmalloc -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1 -s SINGLE_FILE=1 -s STRICT=1 -o Miner.js
```

Then some files will appear at the `dist` directory, `lib.js` is the module.
