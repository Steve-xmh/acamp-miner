#version 300 es

/*
  SHA1 in GLSL ES 3.00
  Made by SteveXMH 2020/3/18
*/

precision highp float;
uniform sampler2D rawData; // 原始的数据纹理
uniform float imageWidth; // 纹理的宽度（也代表长度，不过不需要）
in vec3 v_pointPos; // 输入转换后与位图数据对齐的第一个像素的中心坐标，XY为位图位置，Z为当前计算的ID
out vec4 color; // 输出的颜色值，按 RGBA 排序，都在 [0.0-1.0] 之间

#define MAX_STRING_LENGTH ([REPLACE_MAX_STRING_LENGTH]) // 最大字符串长度限制，在 JS 里这里会被替换成 64

uint hashStr[MAX_STRING_LENGTH]; // 用于存放从纹理数据里提取的字符串数据
uint strLen = 0u; // 字符串的长度
uint strBackLen = 0u; // 字符串后缀的长度
uint numberLen = 0u; // 数字的长度
uint startNumber = 0u; // 数字的开始位置
uint currentNumber = 0u; // 需要计算的数字，以 
uint numberStartPos = 0u;
float wPixelOffset;
float debug = 0.0;
uint h[5];
uint m[16];
uint w[80];

#define UINT_SIZE (8u)
// 计算原石数量
uint checkIsRock(uint h) {
  uint counter = UINT_SIZE;
  while (counter != 0u) {
    counter--;
    uint test = h >> (UINT_SIZE - counter) * 4u;
    if (test == 0u)
      break;
  }
  return counter < 0u ? 0u : counter;
}

// 哈希正片
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
            m[i / 4] |= hashStr[i] << n;
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
    return 9u;
    // 4,294,967,295‬
}

// 将数字加上自己的ID并存入字符串变量内，参数是字符串变量里数字段的开始位置
uint addIdToNumber (uint start)
{
    currentNumber = startNumber + uint(v_pointPos.z);
    uint lastNumberLen = getNumberLength(startNumber);
    numberLen = getNumberLength(currentNumber);
    uint temp = currentNumber;
    for (int i = 0; i < 10; i++)
    {
        if (numberLen <= uint(i)) break;
        uint aNum = temp % 10u;
        hashStr[start + numberLen - uint(i)] = aNum + 48u;
        temp = (temp - temp % 10u) / 10u;
    }
    debug = float(hashStr[start + numberLen]) - 48.0;
    // debug = float(strLen - start - (strLen - numberStartPos) + numberLen) / 255.0;
    return numberLen - lastNumberLen;
}

void collectString (vec2 canvasPoint)
{
    vec4 charColor = vec4(0.0, 0.0, 0.0, 0.0);
    for (int i = 0; i < MAX_STRING_LENGTH; i++)
    {
        hashStr[i] = 0u;
    };
    int c = 0;
    uint x = 0u;
    strLen = 0u;
    startNumber = 0u;
    // 开始循环
    for (int i = 0; i < MAX_STRING_LENGTH; i++)
    {
        // 获取字符数据所在像素点颜色
        charColor = texture(rawData, canvasPoint + vec2(wPixelOffset * float(x), wPixelOffset * float(c)));
        // 转换成整数存储
        hashStr[i] = uint(floor(charColor.a * 255.0));
        // 当正在解析数字且当前文字不属于 \0 时
        if (c == 1 && hashStr[i] != 0u)
        {
            // 把当前数字与刚刚获取到的整数相加
            startNumber = startNumber + (hashStr[i] - 48u);
            // 进一位，给后面的数字让空间
            startNumber = startNumber * 10u;
        }
        // 当遇到 \0 时进入下一阶段
        if (hashStr[i] == 0u)
        {
            // 如果数字解析完毕则测量数字作为字符串时的长度，并将当前的计算编号与之相加
            if (c == 1)
            {
                // 因为最后一次添加数字时进了一位，所以要退一位回来
                startNumber = startNumber / 10u;
                uint added = addIdToNumber(numberStartPos);
                strLen+=added;
                debug = float(added);
            } else if (c == 0)
            {
                numberStartPos = uint(i - 2);
            }
            c++;
            x = 0u;
            if (c > 2) break;
            continue;
        }
        x++;
        strLen++;
    };
}

void main ()
{
    wPixelOffset = 1.0 / imageWidth;
    // vec4(float(strLen) / 255.0, 0.0, 0.0, 1.0)
    vec2 canvasPoint = vec2(wPixelOffset / 2.0, wPixelOffset / 2.0);
    collectString(canvasPoint);
    sha();
    // gl_FragColor = texture(rawData, (v_pointPos.xy + 1.0) / 2.0);
    // gl_FragColor = vec4((v_pointPos.x + 1.0) / 2.0, (v_pointPos.y + 1.0) / 2.0, 0.0, 1.0);
    uint rocks = checkIsRock(h[0]);
    color = vec4(
        // float(strLen) / float(255),
        // debug / 255.0,
        // float(float(startNumber) + v_pointPos.z) / float(10000000),
        float(v_pointPos.z) / float(1000000),
        // debug,
        float(rocks) / 256.0,
        // 0.0,
        float((h[0])) / float(4294967295u),
        // float(rocks) / 255.0,
        1.0
        );
}
