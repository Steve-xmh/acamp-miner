# AcampMiner

A module for the mining feature in Aerfaying Mozhua platform.

## Why this?

- Pretty fast, using worker and WebAssembly (If avaliable) for boosting.
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

## Performance benchmark testing

CPU: `Intel(R) Core(TM) i5-3470 CPU @ 3.20GHz`
Browser: `Google Chrome/83.0.4103.116`

|Method|Time per chunk|Faster than last one|Faster than first one|
|---|---|---|---|
|1 thread Worker|100s|1x|1x|
|4 threads Worker|33s|3x|3x|
|1 thread WASM Worker|13s|2.5x|7.7x|
|2 thread WASM Worker|6s|2.1x|16.6x|
|4 threads WASM Worker|3s|2x|33x|
