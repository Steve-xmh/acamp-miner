import CPUMiner from './index'
/*
try {
    const button = document.querySelector('#submit') as HTMLButtonElement
    const miner = new AerfayingMiner()
    document.body.appendChild(miner.outputCanvas)
    document.body.appendChild(miner.canvas)
    button.addEventListener('click', (evt) => {
        // miner.mine('hello world 3.0-12457-1234-', 0, '')

        miner.mine(
            // String.fromCharCode(1, 255, 1, 255, 1, 255, 1, 255, 1, 255, 1, 255, 1, 255, 1, 255, 1, 255, 1, 255)
            'oahsdfihaosidyhfoiysadoifhsdoitoe'
            , 1000000, '')
    })
    button.click()
} catch (error) {
    document.querySelector('strong').innerText = error
}
*/

const initData = {
    message: 'Hello world 3.0-12345-5575448-',
    startNumber: 5000,
    endNumber: 10000000 + 5000,
    minZeroCount: 4
}

function resetProgress (threads: number) {
    const progressBar = document.querySelector('.progress-bar')
    progressBar.innerHTML = ''
    const progress = document.createElement('div')
    progress.className = 'progress'
    progressBar.appendChild(progress)
    const subProgress = new Array(threads).fill(null).map(() => {
        const ele = document.createElement('div')
        ele.className = 'curr'
        progressBar.appendChild(ele)
        return ele
    })
    return [progress, ...subProgress]
}

function add (nums: number[]) {
    let r = 0
    for (const num of nums) {
        r += num
    }
    return r
}

try {
    const miner1 = new CPUMiner(1)
    const miner4 = new CPUMiner(4)
    const button = document.querySelector('#submit') as HTMLButtonElement
    const output = document.querySelector('#output') as HTMLElement
    button.addEventListener('click', async (evt) => {
        button.disabled = true
        output.innerText = '开始运行测试：单线程 Worker 计算：10000000\n'
        let eles = resetProgress(1)
        let startTime = Date.now()
        let result: number[] = await miner1.start(initData)
        let total = Date.now() - startTime
        eles = resetProgress(3)
        output.innerText += `单线程 Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
        output.innerText += `已挖原石位置：${result.join()}\n`
        // output.innerText += `已挖原石：${add(miner1.minedRocks.map(v => v.size))}\n`
        output.innerText += '开始运行测试：四线程 Worker 计算：10000000\n'
        startTime = Date.now()
        result = await miner4.start(initData)
        total = Date.now() - startTime
        output.innerText += `四线程 Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
        output.innerText += `已挖原石位置：${result.join()}\n`
        // output.innerText += `已挖原石：${add(miner4.minedRocks.map(v => v.size))}\n`
        output.innerText += '测试已结束！\n'
        button.disabled = false
    })
} catch (error) {
    document.querySelector('strong').innerText = error
    console.error('发生错误', error)
}
