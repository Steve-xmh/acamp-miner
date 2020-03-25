import sha1 from 'crypto-js/sha1'

interface MineMessage {
    message: string,
    startNumber: number,
    endNumber: number,
    minZeroCount: number
}

function main (args: MineMessage) {
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

onmessage = evt => postMessage(main(evt.data as MineMessage))
