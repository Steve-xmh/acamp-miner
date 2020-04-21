import CPUMiner, { GPUMiner } from './index'

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

document.querySelector('button#gpu').addEventListener('click', () => {
    document.querySelector('div#gpu').classList.remove('hide')
    document.querySelector('div#cpu').classList.add('hide')
})
document.querySelector('button#cpu').addEventListener('click', () => {
    document.querySelector('div#gpu').classList.add('hide')
    document.querySelector('div#cpu').classList.remove('hide')
})

const initData = {
    message: 'Hello world 3.0-12345-5575448-',
    startNumber: 5000,
    endNumber: 10000000 + 5000,
    minZeroCount: 5
}

try {
    const miner1 = new CPUMiner(1)
    const miner4 = new CPUMiner(4)
    const minerwasm1 = new CPUMiner(1)
    const minerwasm4 = new CPUMiner(4)
    const gpuMiner = new GPUMiner()
    const cpuSubmitBtn = document.querySelector('div#cpu #submit') as HTMLButtonElement
    const gpuSubmitBtn = document.querySelector('div#gpu #submit') as HTMLButtonElement
    const cpuOutput = document.querySelector('div#cpu #output') as HTMLElement
    cpuSubmitBtn.addEventListener('click', async (evt) => {
        await minerwasm1.buildWASM()
        await minerwasm4.buildWASM()
        let startTime = Date.now()
        let result: number[] = []
        let total = Date.now() - startTime

        cpuSubmitBtn.disabled = true
        cpuOutput.innerText = ''
        if ((document.querySelector('input#sw') as HTMLInputElement).checked) {
            cpuOutput.innerText += '开始运行测试：单线程 Worker 计算：10000000\n'
            startTime = Date.now()
            result = await miner1.start(initData)
            total = Date.now() - startTime
            cpuOutput.innerText += `单线程 Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
            cpuOutput.innerText += `已挖原石位置：${result.join()}\n`
        }

        if ((document.querySelector('input#fw') as HTMLInputElement).checked) {
            cpuOutput.innerText += '开始运行测试：四线程 Worker 计算：10000000\n'
            startTime = Date.now()
            result = await miner4.start(initData)
            total = Date.now() - startTime
            cpuOutput.innerText += `四线程 Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
            cpuOutput.innerText += `已挖原石位置：${result.join()}\n`
        }

        if ((document.querySelector('input#wsw') as HTMLInputElement).checked) {
            cpuOutput.innerText += '开始运行测试：单线程 WASM Worker 计算：10000000\n'
            startTime = Date.now()
            result = await minerwasm1.start(initData)
            total = Date.now() - startTime
            cpuOutput.innerText += `单线程 WASM Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
            cpuOutput.innerText += `已挖原石位置：${result.join()}\n`
        }

        if ((document.querySelector('input#wfw') as HTMLInputElement).checked) {
            cpuOutput.innerText += '开始运行测试：四线程 WASM Worker 计算：10000000\n'
            startTime = Date.now()
            result = await minerwasm4.start(initData)
            total = Date.now() - startTime
            cpuOutput.innerText += `四线程 WASM Worker 测试结束，用时 ${total}ms，速度约为 ${10000000 / (total / 1000)}hash/s\n`
            cpuOutput.innerText += `已挖原石位置：${result.join()}\n`
        }

        cpuOutput.innerText += '测试已结束！\n'
        cpuSubmitBtn.disabled = false
    })
    if (!gpuMiner.isWebGL2ComputeSupported) {
        document.querySelector('div#gpu').innerHTML = '抱歉，你的浏览器不支持 WebGL2 Compute Shader，请尝试启用 WebGL2 Compute Shader 后重试'
    } else {
        gpuSubmitBtn.addEventListener('click', async (evt) => {
            gpuMiner.mine('hello world', 0)
        })
    }
} catch (error) {
    document.querySelector('strong').innerHTML = (error.toString() as string).replace('\n', '<br/>')
    console.error('发生错误', error)
}
