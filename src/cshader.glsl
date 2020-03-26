#version 310 es
precision highp float;

#define MAX_THREAD_NUM [JS_MAX_THREAD_NUM]
#define MAX_STRING_LENGTH 50

layout (local_size_x = MAX_THREAD_NUM, local_size_y = 1, local_size_z = 1) in;
layout (std430, binding = 0) buffer BufferData {
    uint data[];
} bufferData;
uniform uint offset;
uniform uint sharedData[40];

uint hashStr[MAX_STRING_LENGTH];
uint strLen = 40u; // 字符串的长度
uint h[5];
uint m[16];
uint w[80];

// 哈希计算本体
#define S(x, n) (((x) << n) | (x) >> (32 - n))
void sha ()
{
    {
        int n;
        int i;
        for (i = 0; i < 16; i++)
        {
            m[i] = 0u;
        }
        for (i = 0; i < MAX_STRING_LENGTH; i++)
        {
            if (i >= int(strLen)) break;
            n = 24 - ((i & 0x03) << 3);
            m[i / 4] |= (hashStr[i] << n);
        }
        n = 24 - ((i & 0x03) << 3);
        m[1 / 4] |= 0x80u << n;
        m[15] = strLen * 8u;
    }
    {
        int i;
        for (i = 0; i < 16; i++)
        {
            w[i] = m[i];
        }
        for (i = 16; i < 80; i++)
        {
            w[i] = w[i - 16] ^ w[i - 14] ^ w[i - 8] ^ w[i - 3];
            w[i] = S(w[i], 1);
        }
    }
    {
        int i;

        uint a, b, c, d, e, f, k;

        uint temp;

        h[0] = 0x67452301u;
        h[1] = 0xEFCDAB89u;
        h[2] = 0x98BADCFEu;
        h[3] = 0x10325476u;
        h[4] = 0xC3D2E1F0u;

        a = h[0];
        b = h[1];
        c = h[2];
        d = h[3];
        e = h[4];
        for (i = 0; i < 80; i++) {
        switch (i / 20) {
        case 0:
            k = 0x5A827999u;
            f = (b & c) | (~b & d);
            break;
        case 1:
            k = 0x6ED9EBA1u;
            f = b ^ c ^ d;
            break;
        case 2:
            k = 0x8F1BBCDCu;
            f = (b & c) | (b & d) | (c & d);
            break;
        case 3:
            k = 0xCA62C1D6u;
            f = b ^ c ^ d;
            break;
        }
        temp = S(a, 5) + f + e + w[i] + k;
        e = d;
        d = c;
        c = S(b, 30);
        b = a;
        a = temp;
        }
        // 86f7e437 faa5a7fc e15d1ddc b9eaeaea 377667b8
        h[0] += a;
        h[1] += b;
        h[2] += c;
        h[3] += d;
        h[4] += e;
    }
}

// 土办法，但是可行
uint getNumberLength (uint number)
{
    if (number < 10u) return 1u;
    if (number < 100u) return 2u;
    if (number < 1000u) return 3u;
    if (number < 10000u) return 4u;
    if (number < 100000u) return 5u;
    if (number < 1000000u) return 6u;
    if (number < 10000000u) return 7u;
    if (number < 100000000u) return 8u;
    if (number < 1000000000u) return 9u;
    return 10u;
    // 4,294,967,295‬
}

// 复制信息到数组
void copy () {
    uint number = offset + gl_LocalInvocationID.x;
    uint numberLen = getNumberLength(number);
    strLen = 40u + numberLen;
    for (int i = 0; i < MAX_STRING_LENGTH; i++)
    {
        hashStr[i] = 0u;
    }
    for (int i = 0; i < 40; i++)
    {
        hashStr[i] = sharedData[i];
    }
    if (number == 0u)
    {
        hashStr[40] = 48u;
    }
    else
    {
        uint temp = number;
        int i = 1;
        while (temp != 0u)
        {
            hashStr[39 + int(numberLen) - i] = (temp % 10u) + 48u;
            temp = (temp - temp % 10u) / 10u;
            i++;
        }
    }
    /*
    for (int i = 0; i < MAX_STRING_LENGTH; i++)
    {
        bufferData.data[ gl_LocalInvocationID.x * 50u + uint(i) ] = hashStr[i];
    }
    */
}

void main()
{
    copy();
    sha();
    bufferData.data[ gl_LocalInvocationID.x ] = h[0] ;
    memoryBarrierShared();
}
