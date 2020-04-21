import sha1 from 'crypto-js/sha1'
const WasmMiner = require('./Miner.js')

/*

function sha1(text) {
    const te = new TextEncoder()
    const ar = te.encode(text)
    const tp = wasm.instance._malloc(ar.byteLength + 1)
    for (let i = 0; i < ar.length; i++) {
        wasm.instance.HEAP8[tp + i] = ar[i];
    }
    const startTime = Date.now()
    performance.mark('start')
    const resultPointer = wasm.instance._sha1(tp, 0, 10000000, 4)
    performance.mark('end')
    const endTime = Date.now()
    const resultPos = resultPointer / wasm.instance.HEAP32.BYTES_PER_ELEMENT
    const resultLength = wasm.instance.HEAP32[resultPos]
    const result = wasm.instance.HEAP32.subarray(resultPos, resultPos + resultLength)
    wasm.instance._free(resultPointer)
    wasm.instance._free(tp)
    console.log(resultPointer, resultPos, resultLength, result)
    console.log(endTime - startTime, 'ms')
    return result
}

*/
interface MineMessage {
    message: string,
    startNumber: number,
    endNumber: number,
    minZeroCount: number,
    complieWasm?: boolean
}

/** 等下会用到的 wasm 成员 */
interface WASMInstance {
    HEAP8: Int8Array,
    HEAP32: Int32Array,
    _malloc: (size: number) => number
    _free: (size: number) => void
    _sha1: (inputfrontstr: number, startNumber: number, endNumber: number, minZeroCount: number) => number
}

interface WASMData {
    instance?: WASMInstance,
    isReady: boolean
}

const wasm: WASMData = {
    instance: null,
    isReady: false
}

const isWASMSupported = (() => {
    try {
        return !!WebAssembly
    } catch {
        return false
    }
})()

async function compileWasm () {
    if (wasm.isReady) return 'WASMREADY'
    try {
        wasm.instance = new WasmMiner() as WASMInstance
        wasm.isReady = true
    } catch (error) {
        wasm.instance = null
        wasm.isReady = false
        console.warn('WASM compile failed:', error)
        return 'WASMFAILED'
    }
    return 'WASMREADY'
}

function jsMain (args: MineMessage) {
    const zeros = '0'.repeat(args.minZeroCount)
    if (args.startNumber && args.endNumber && args.minZeroCount) {
        const minedPos: number[] = []
        for (let i = args.startNumber; i < args.endNumber; i++) {
            const str = args.message + i
            const result = sha1(str).toString() as string
            if (result.startsWith(zeros)) {
                minedPos.push(i)
            }
        }
        return minedPos
    } else {
        return sha1(args.message).toString() as string
    }
}

function wasmMain (args: MineMessage) {
    const instance = wasm.instance
    const te = new TextEncoder()
    const ar = te.encode(args.message)
    const tp = instance._malloc(ar.byteLength + 1)
    for (let i = 0; i < ar.length; i++) {
        instance.HEAP8[tp + i] = ar[i]
    }
    const resultPointer = instance._sha1(tp, args.startNumber, args.endNumber, args.minZeroCount)
    const resultPos = resultPointer / instance.HEAP32.BYTES_PER_ELEMENT + 1
    const resultLength = instance.HEAP32[resultPos - 1]
    const result: number[] = []
    instance.HEAP32.subarray(resultPos, resultPos + resultLength).forEach(v => result.push(v + args.startNumber))
    instance._free(resultPointer)
    instance._free(tp)
    return result
}

async function main (args: MineMessage) {
    if (isWASMSupported && args.complieWasm) {
        return compileWasm()
    } else if (isWASMSupported && wasm.isReady) {
        return wasmMain(args)
    } else {
        return jsMain(args)
    }
}

onmessage = evt => main(evt.data as MineMessage).then(postMessage)
