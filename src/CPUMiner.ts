import sha1 from 'crypto-js/sha1'
/**
 * 挖矿初始信息，哈希字符串按照 字符串前缀的sha1+数字 组合进行计算。
 */
interface MineInitData {
    /** 字符串前缀 */
    message: string,
    /** 起始数字 */
    startNumber: number,
    /** 最后一个数字，必须大于等于起始数字 */
    endNumber: number
    /** 开头最少要有多少个零 */
    minZeroCount: number
}

/** 原石数据 */
interface RockData {
    /** 原石出现的位置，不加上初始数字 */
    position: number,
    /** 原石的原始字符串 */
    hashStr: string
    /** 原石的大小 */
    size: number
}

const MinerWorker = require('./CPUMinerWorker.worker.ts')

/**
 * 基于 WebWorker 的多线程挖矿对象
 */
class CPUMiner {
    private workers: Worker[] = []
    /** 是否正在工作 */
    public isWorking: boolean = false
    /** 线程的总数量 */
    public threads: number = 4
    public minedRocks: RockData[] = []
    /**
     * 创建一个基于 Worker 的多线程挖矿对象
     * @param maxThreads 需要创建的最大线程数量，默认为 `4`，后面无法修改
     */
    constructor (maxThreads: number = 4) {
        // postMessage
        this.threads = maxThreads
        for (let i = 0; i < maxThreads; i++) {
            this.workers[i] = new MinerWorker() as Worker
            this.workers[i].addEventListener('error', this.onWorkerError)
        }
    }

    private onWorkerError (this:Worker, err: ErrorEvent) {
        console.error(err)
    }

    /**
     * 开始计算，如果正在运行则不做任何处理
     * @param mineData 初始挖矿信息
     */
    public start (mineData: MineInitData) {
        if (this.isWorking) return Promise.reject(new Error('Miner is working'))
        if (mineData.endNumber < mineData.startNumber) return Promise.reject(new Error('End number is smaller than start number'))
        return new Promise((resolve: (result: number[]) => any) => {
            this.isWorking = true
            const startHash = sha1(mineData.message).toString()
            const chunkPerThread = (mineData.endNumber - mineData.startNumber) / this.threads
            const result: number[] = []
            let workingThreads = this.threads
            function onMsg (evt: MessageEvent) {
                result.push(...(evt.data as number[]))
                console.log(evt)
                evt.target.removeEventListener('message', onMsg)
                workingThreads--
                if (workingThreads <= 0) resolve(result.sort((a, b) => a - b))
            }
            this.workers.forEach((v, i, a) => {
                const missionData: MineInitData = {
                    message: startHash,
                    startNumber: mineData.startNumber + i * chunkPerThread,
                    endNumber: mineData.startNumber + (i + 1) * chunkPerThread,
                    minZeroCount: mineData.minZeroCount
                }
                console.log(missionData)
                v.addEventListener('message', onMsg)
                v.postMessage(missionData)
            })
        })
    }

    /**
     * 停止挖掘
     */
    public stop () {
        this.workers.forEach(v => {
            v.terminate()
        })
    }

    /**
     * 销毁挖矿对象，执行此函数后不应再执行任何有关的成员函数
     */
    public dispose () {
        this.workers.forEach(v => {
            v.terminate()
        })
        this.workers = null
    }
}

export default CPUMiner
