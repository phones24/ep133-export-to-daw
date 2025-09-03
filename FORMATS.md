# EP-133 file formats data

### PADS

```
[
0  0,
1  0,    // INSTRUMENT NUM
2  0,    // INSTRUMENT NUM
3  0,
4  0,    // TRIM LEFT
5  0,    // TRIM LEFT
6  0,    // TRIM LEFT
7  0,
8  0,    // TRIM RIGHT
9  0,    // TRIM RIGHT
10  0,   // TRIM RIGHT
11  0,
12  0,
13  0,
14  248,
15  66,
16  100,  // VOLUME (0-200)
17  0,    // PITCH (negative: 254-255, zero: 0, positive: 1-12, )
18  0,    // PAN (left: 240-255, center: 0, right: 1-16)
19  0,    // ATACK (0-255), when in KEY/LEG mode
20  255,  // RELEASE (0-255), when in KEY/LEG mode
21  0,
22  0,
23  0,    // ONE - 0, KEY - 1, LEG - 2,
24  60,   // PAD ID ?
25  0,
26  0     // PITCH DECIMAL PART
]
```

### PATTERNS
```
{
    "0": 0,
    "1": 2, // bars
    "2": 8, // notes count
    "3": 0,

    "4": 0,   // position LB
    "5": 0,   // position HB
    "6": 80,  // N / 8 - pad number
    "7": 60,  // note
    "8": 100, // velocity
    "9": 43,  // duration LB
    "10": 0,  // duration HB
    "11": 0,

    "12": 96,
    "13": 0,
    "14": 80,  // instrument id or pad id
    "15": 60,  // note
    "16": 100, // velocity
    "17": 44,  // duration
    "18": 0,   // duration
    "19": 245,

    "20": 192,
    "21": 0,
    "22": 80,  // instrument id or pad id
    "23": 60,
    "24": 100,
    "25": 56,
    "26": 0,
    "27": 16,

    "28": 32,
    "29": 1,
    "30": 80,
    "31": 60,
    "32": 100,
    "33": 53,
    "34": 0,
    "35": 0,
    "36": 128,

    "37": 1,
    "38": 80,
    "39": 60,
    "40": 100,
    "41": 55,
    "42": 0,
    "43": 0,
    "44": 224,

    "45": 1,
    "46": 80,
    "47": 60,
    "48": 100,
    "49": 53,
    "50": 0,
    "51": 16,
    "52": 64,

    "53": 2,
    "54": 80,
    "55": 60,
    "56": 100,
    "57": 54,
    "58": 0,
    "59": 0,
    "60": 160,

    "61": 2,
    "62": 80,
    "63": 60,
    "64": 100,
    "65": 43,
    "66": 0,
    "67": 129
}
```
