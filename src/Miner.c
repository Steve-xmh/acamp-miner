#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define S(x, n) (((x) << n) | (x) >> (32 - n))

typedef struct RockNode
{
    int offset;
    struct RockNode *next;
} RockNode;

RockNode* makeNode()
{
    RockNode* node = (RockNode*)malloc(sizeof(RockNode));
    node->offset = -1;
    node->next = NULL;
    return node;
}

void addToRockArrayAndRelease(RockNode *node, int *array)
{
    if (node == NULL) return;
    if (node->offset != -1) *array = node->offset;
    if (node->next) addToRockArrayAndRelease(node->next, array + 1);
    free(node);
}

int checkIsRock(unsigned int h)
{
    int counter = sizeof(h) * 2;
    while (counter--)
    {
        unsigned int test = h >> (sizeof(h) * 2 - counter) * 4;
        if (test == 0)
            break;
    }
    return counter < 0 ? 0 : counter;
}

#define STR_SIZE (256)

int* sha1(char *inputfrontstr, unsigned int startNumber, unsigned int endNumber, int minZeroCount)
{
    unsigned int h[5];
    unsigned int m[16];
    unsigned int w[80];

    char input[STR_SIZE];
    int len = 0;

    RockNode *root = makeNode();
    RockNode *curNode = root;
    int chainLength = 0;
    
    for (int offset = 0; offset <= endNumber - startNumber; offset++)
    {
        int currentNumber = startNumber + offset;
        sprintf(input, "%s%d", inputfrontstr, currentNumber);
        len = strlen(input);

        {
            int i;
            int n;
            for (i = 0; i < 16; i++)
            {
                m[i] = 0;
            }

            for (i = 0; i < len; i++)
            {
                n = 24 - ((i & 0x03) << 3);
                m[i / 4] |= input[i] << n;
            }
            n = 24 - ((i & 0x03) << 3);
            m[i / 4] |= 0x80 << n;
            m[15] = len * 8;
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

            unsigned int a, b, c, d, e, f, k;

            unsigned int temp;

            h[0] = 0x67452301;
            h[1] = 0xEFCDAB89;
            h[2] = 0x98BADCFE;
            h[3] = 0x10325476;
            h[4] = 0xC3D2E1F0;

            a = h[0];
            b = h[1];
            c = h[2];
            d = h[3];
            e = h[4];
            for (i = 0; i < 80; i++)
            {
                switch (i / 20)
                {
                case 0:
                    k = 0x5A827999;
                    f = (b & c) | (~b & d);
                    break;
                case 1:
                    k = 0x6ED9EBA1;
                    f = b ^ c ^ d;
                    break;
                case 2:
                    k = 0x8F1BBCDC;
                    f = (b & c) | (b & d) | (c & d);
                    break;
                case 3:
                    k = 0xCA62C1D6;
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
            h[0] += a;
            h[1] += b;
            h[2] += c;
            h[3] += d;
            h[4] += e;
        }
        int rockSize = checkIsRock(h[0]);
        if(rockSize >= minZeroCount)
        {
            curNode->offset = offset;
            curNode->next = makeNode();
            curNode = curNode->next;
            chainLength++;
        }
    }
    if (chainLength == 0) return 0;
    int *array = (int*)malloc(sizeof(int) * (chainLength + 1));
    array[0] = chainLength;
    addToRockArrayAndRelease(root, array + 1);
    return array;
}
