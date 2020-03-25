const vshaderSource = typeof require('./vshader.glsl') === 'string' ? require('./vshader.glsl') : require('./vshader.glsl').sourceCode
const fshaderSource = typeof require('./fshader.glsl') === 'string' ? require('./fshader.glsl') : require('./fshader.glsl').sourceCode

class GPUMiner {
    private static chunkAmount: number = 10
    private static chunk: number = 1000000
    private static canvasWidthScale: number = 1000
    public static maxStrLength: number = 64

    public canvas: HTMLCanvasElement
    public output2dCanvas: HTMLCanvasElement
    public outputCanvas: HTMLCanvasElement
    public ctx: CanvasRenderingContext2D
    public gl: WebGLRenderingContext
    public prog: WebGLProgram
    public isReady: boolean = false
    public vertices: Float32Array
    public texture: WebGLTexture
    public verticeBuf: WebGLBuffer
    public isWebGL2Supported: boolean = false

    constructor (offscreen = false) {
        // 创建画板
        // this.canvas = offscreen ? new OffscreenCanvas(16, 16) : document.createElement('canvas')
        // this.outputCanvas = offscreen ? new OffscreenCanvas(1000, 1000) : document.createElement('canvas')
        // this.output2dCanvas = offscreen ? new OffscreenCanvas(1000, 1000) : document.createElement('canvas')
        this.canvas = document.createElement('canvas')
        this.outputCanvas = document.createElement('canvas')
        this.output2dCanvas = document.createElement('canvas')

        // 调整大小，正式计算的时候会调整到与所需长宽最小的二次幂值以适应 WebGL 渲染
        this.canvas.width = GPUMiner.maxStrLength
        this.canvas.height = 3
        // 第一行是前面的字符串
        // 第二行是初始数字
        // 第三行是后面的字符串
        this.outputCanvas.width = GPUMiner.canvasWidthScale
        this.outputCanvas.height = GPUMiner.chunk / GPUMiner.canvasWidthScale
        // 是否支持 WebGL2？
        if (this.outputCanvas.getContext('webgl2', { preserveDrawingBuffer: true })) {
            this.isWebGL2Supported = true
            this.initWebGL()
        } else {
            this.isWebGL2Supported = false
        }
        this.isReady = true
        {
            const fakestr = 'hello world'.split('')
            const raw = 578
            const addId = 823453
            const numberStart = fakestr.length
            let temp = addId + raw
            let lastNumberLength = raw.toString().length
            let numberLength = (addId + raw).toString().length
            for (let i = 0; i < 10; i++)
            {
                if (i >= numberLength) break
                fakestr[numberStart + numberLength - i] = String.fromCharCode(temp % 10 + 48)
                temp = (temp - temp % 10) / 10
            }
            console.log(raw, addId, raw + addId, fakestr.join(''), numberStart + numberLength)
        }
        console.log('GPU 挖矿准备完毕')
    }

    /**
     * 初始化 WebGL 画板
     */
    initWebGL () {
        this.outputCanvas.width = GPUMiner.canvasWidthScale
        this.gl = this.outputCanvas.getContext('webgl2', { preserveDrawingBuffer: true })
        console.log('正在使用渲染引擎', this.gl.getParameter(this.gl.RENDERER))
        console.log('WebGL 版本', this.gl.getParameter(this.gl.VERSION))
        console.log('WebGL 着色器版本', this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION))
        // 创建着色器
        const vshader = this.gl.createShader(this.gl.VERTEX_SHADER)
        const fshader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
        const prog = this.gl.createProgram()
        // 编译
        this.gl.shaderSource(vshader, vshaderSource)
        this.gl.shaderSource(fshader, fshaderSource.replace(/\[REPLACE_MAX_STRING_LENGTH\]/, GPUMiner.maxStrLength))
        this.gl.compileShader(vshader)
        if (!this.gl.getShaderParameter(vshader, this.gl.COMPILE_STATUS)) {
            throw new Error('顶点着色器编译失败：' + this.gl.getShaderInfoLog(vshader))
        }
        this.gl.compileShader(fshader)
        this.gl.attachShader(prog, fshader)
        if (!this.gl.getShaderParameter(fshader, this.gl.COMPILE_STATUS)) {
            throw new Error('片段着色器编译失败：' + this.gl.getShaderInfoLog(fshader))
        }
        // 链接着色器到程序
        this.gl.attachShader(prog, vshader)
        this.gl.linkProgram(prog)
        if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
            throw new Error('程序链接失败：' + this.gl.getProgramInfoLog(prog))
        }
        // 创建坐标缓冲
        const vertices = new Float32Array(3 * GPUMiner.chunk)
        this.vertices = vertices
        this.prog = prog
        this.verticeBuf = this.gl.createBuffer()
        this.rebuildVertices()
        // 创建纹理
        this.texture = this.gl.createTexture()
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.finish()
    }

    /**
     * 重建坐标缓冲，对准每个像素点**中心**
     */
    rebuildVertices () {
        let i = 0
        for (let y = 0; y < this.outputCanvas.height; y++) {
            for (let x = 0; x < this.outputCanvas.width; x++) {
                this.vertices[i * 3] = ((x + 0.5) / this.outputCanvas.width) * 2 - 1
                this.vertices[i * 3 + 1] = ((y + 0.5) / this.outputCanvas.height) * -2 + 1
                this.vertices[i * 3 + 2] = i
                i++
            }
        }
    }

    /**
     * 计算所需最小的二次幂大小，用于画板大小替换
     * @param w 所需长度
     * @param h 所需宽度
     */
    calculateSize (w:number, h:number) {
        let size = 2
        while (size < w || size < h) { size = size * 2 }
        return size
    }

    /**
     * 开始计算哈希
     * @param front 哈希字符串的前缀
     * @param number 哈希数字的起始值，计算中会根据编号叠加
     * @param back 哈希字符串的后缀
     */
    mine (front: string, number: number, back: string) {
        let chunkNum = 0
        const miner = this
        let total = 0

        function mineChunk () {
            // 把文字化作图像
            const maxStrLen = front.length + (chunkNum * GPUMiner.chunk + number + GPUMiner.chunk - 1).toString().length + back.length
            if (maxStrLen >= GPUMiner.maxStrLength) {
                throw new Error(`Hit max string length limit, needed ${maxStrLen + 1} but only ${GPUMiner.maxStrLength}`)
            }
            // console.log(front.length + (chunkNum * AerfayingMiner.chunk + number).toString().length + back.length)

            const normalSize = {
                w: GPUMiner.maxStrLength,
                h: GPUMiner.maxStrLength
            }
            miner.canvas.width = miner.canvas.height = miner.calculateSize(normalSize.w, normalSize.h)
            miner.outputCanvas.height = GPUMiner.chunk / GPUMiner.canvasWidthScale
            miner.output2dCanvas.width = miner.outputCanvas.width
            miner.output2dCanvas.height = miner.outputCanvas.height
            miner.ctx = miner.canvas.getContext('2d')
            miner.ctx.clearRect(0, 0, miner.canvas.width, miner.canvas.height)
            const imageData = miner.ctx.getImageData(0, 0, miner.canvas.width, miner.canvas.height)
            for (let i = 0; i < front.length; i++) {
                imageData.data[i * 4 + 3] = front.charCodeAt(i)
            }
            const numStr = (chunkNum * GPUMiner.chunk + number).toString()
            console.log(front.length + (chunkNum * GPUMiner.chunk + number).toString().length + back.length)
            console.log('NUMRAW', numStr, numStr.length)
            console.log(maxStrLen)
            for (let i = 0; i < numStr.length; i++) {
                imageData.data[imageData.width * 4 + i * 4 + 3] = numStr.charCodeAt(i)
                console.log('NUM', numStr.charCodeAt(i))
            }
            for (let i = 0; i < back.length; i++) {
                imageData.data[8 * imageData.width + i * 4 + 3] = back.charCodeAt(i)
            }
            // imageData.data[(imageData.width * posY + posX * maxStrLen + x) * 4 + 3] = t.charCodeAt(0)
            miner.ctx.putImageData(imageData, 0, 0)
            const gl = miner.gl

            // 原始数据纹理
            gl.activeTexture(gl.TEXTURE0)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, miner.canvas)
            gl.bindTexture(gl.TEXTURE_2D, miner.texture)

            // Uniforms
            gl.useProgram(miner.prog)
            gl.uniform1f(gl.getUniformLocation(miner.prog, 'imageWidth'), miner.canvas.width)

            // 顶点
            const positionLocation = gl.getAttribLocation(miner.prog, 'pointPos')
            gl.bindBuffer(gl.ARRAY_BUFFER, miner.verticeBuf)
            gl.bufferData(gl.ARRAY_BUFFER, miner.vertices, gl.STATIC_DRAW)
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(positionLocation)

            // 绘制
            gl.drawArrays(gl.POINTS, 0, GPUMiner.chunk)
            gl.finish()

            const output = miner.output2dCanvas.getContext('2d')
            output.drawImage(miner.outputCanvas, 0, 0)
            const resultData = output.getImageData(0, 0, miner.output2dCanvas.width, miner.output2dCanvas.height)
            console.log(resultData)
            for (let i = 0; i < resultData.width * resultData.height; i++)
            {
                const rocks = resultData.data[i * 4 + 1]
                if (rocks > 4) {
                    total += 2 ** (rocks - 4)
                }
            }
            console.log('TOTAL', total)
            // 销毁
            // gl.deleteTexture(miner.texture)
            // gl.deleteBuffer(miner.verticeBuf)
        }

        let steps = 0
        requestAnimationFrame(function mineevt () {
            mineChunk()
            chunkNum++
            steps++
            if (chunkNum < GPUMiner.chunkAmount) {
                if (steps < 10) {
                    setTimeout(mineevt, 800)
                } else {
                    steps = 0
                    console.log(chunkNum + '/' + GPUMiner.chunkAmount)
                    requestAnimationFrame(mineevt.bind(this))
                }
            } else {
                console.log(chunkNum + '/' + GPUMiner.chunkAmount)
                console.log('TOTAL', total)
            }
        }.bind(this))
    }

    /**
     * 销毁使用过的 WebGL 对象
     */
    dispose () {
        if (this.gl) {
            if (this.texture) {
                this.gl.deleteTexture(this.texture)
                this.texture = null
            }
            if (this.verticeBuf) {
                this.gl.deleteBuffer(this.verticeBuf)
                this.verticeBuf = null
            }
        }
    }
}

export default GPUMiner
