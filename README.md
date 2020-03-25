# AcampMiner

A module for the mining feature in Aerfaying Mozhua platform.

## Why this?

- Pretty fast, using worker for boosting.
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

Then some files will appear at the `dist` directory, `lib.js` is the module.
