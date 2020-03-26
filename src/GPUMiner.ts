import SHA1 from 'crypto-js/sha1'

const cshaderSource: string = typeof require('./cshader.glsl') === 'string' ? require('./cshader.glsl') : require('./cshader.glsl').sourceCode

const MAX_THREAD_NUM = 1024

class GPUMiner {
    public canvas: OffscreenCanvas
    public gl: WebGL2ComputeRenderingContext
    public prog: WebGLProgram
    public isReady: boolean = false
    /** 是否支持 WebGL2 并行着色器功能 */
    public isWebGL2ComputeSupported: boolean = false
    private chunkSize: number = 10000000

    /**
     * @param chunkSize 每次计算的数量，一旦决定就无法更改，默认 10000000
     */
    constructor (chunkSize = 10000000) {
        this.canvas = new OffscreenCanvas(1, 1)
        this.chunkSize = chunkSize
        if (this.canvas.getContext('webgl2-compute')) {
            this.isWebGL2ComputeSupported = true
            this.initWebGL()
        } else {
            this.isWebGL2ComputeSupported = false
        }
        this.isReady = true
        console.log('GPU 挖矿准备完毕')
    }

    /**
     * 初始化 WebGL 画板
     */
    initWebGL () {
        this.gl = this.canvas.getContext('webgl2-compute')
        console.log(this.gl.getParameter(this.gl.MAX_FRAGMENT_UNIFORM_VECTORS))
        const shader = this.gl.createShader(this.gl.COMPUTE_SHADER)
        const source = cshaderSource.replace('[JS_MAX_THREAD_NUM]', MAX_THREAD_NUM.toString())
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const err = this.gl.getShaderInfoLog(shader)
            throw new Error('Shader compilion failed: ' + err)
        }
        this.prog = this.gl.createProgram()
        this.gl.attachShader(this.prog, shader)
        this.gl.linkProgram(this.prog)
        if (!this.gl.getProgramParameter(this.prog, this.gl.LINK_STATUS)) {
            const err = this.gl.getProgramInfoLog(this.prog)
            throw new Error('Program linking failed: ' + err)
        }
    }

    /**
     * 开始计算哈希
     * @param front 哈希字符串的前缀字符串，将会使用 sha1 进行转换
     * @param number 哈希数字的起始值，计算中会根据编号叠加，即从 0 到 1024，注意不能大于 4294966271
     */
    mine (front: string, number: number) {
        // if (front.length !== 40) throw new Error('Front text isn\'t equal to 40 characters')
        if (number > 4294966271) throw new Error('Number is too big (Large than 4294966271)')
        const gl = this.gl
        const strArr = new Uint32Array(40).fill(0)
        strArr.set(SHA1(front).toString().split('').map(v => v.charCodeAt(0)))
        console.log(strArr)
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer)
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, new Uint32Array(MAX_THREAD_NUM), gl.DYNAMIC_COPY)
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffer)
        const offsetUniform = gl.getUniformLocation(this.prog, 'offset')
        const sharedDataUniform = gl.getUniformLocation(this.prog, 'sharedData')
        gl.useProgram(this.prog)
        gl.uniform1ui(offsetUniform, number)
        gl.uniform1uiv(sharedDataUniform, strArr)
        gl.dispatchCompute(MAX_THREAD_NUM, 1, 1)
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT)
        const result = new Uint32Array(MAX_THREAD_NUM)
        gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, result)
        const resultHashes = result.join(' ').split(' ').map(v => Number(v).toString(16)).map(v => '0'.repeat(8 - v.length) + v)
        for (let i = 0; i < MAX_THREAD_NUM; i++) {
            const realHash = SHA1(front + (i + number)).toString()
            const realHashSplited = realHash.substring(0, 8)
            if (resultHashes[i] === realHash.substring(0, 8)) {
                console.log('TRUE', resultHashes[i], realHashSplited)
            } else {
                console.log('FALSE', resultHashes[i], realHashSplited)
            }
        }
        // console.log()
        /*
        for (let i = 0; i < MAX_THREAD_NUM; i++) {
            console.log(result.slice(i * 50, i * 50 + 50).join(' ').split(' ').map(v => String.fromCharCode(Number(v))).join(''))
        }
        */
    }
}

export default GPUMiner
